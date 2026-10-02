import type { SupabaseClient } from '@supabase/supabase-js'
import { escapeLikePattern } from '../../../shared/lib/escape-like'
import { supabase } from '../../../shared/supabase/client'
import type { FocusCandidate, FocusConfidence, SimilarExercise } from '../lib/similar-exercises'
import { DEFAULT_SIMILAR_LIMIT, pickSimilarExercises } from '../lib/similar-exercises'

// Same untyped-client cast used across other feature `api/` modules until
// `database.types.ts` is generated — see `features/routines/api/routines.ts`.
const db = supabase as unknown as SupabaseClient

// Read-only surface over the pre-existing, pre-populated `exercises` table.
// This module never writes to `exercises`.
// `instructions`/`instruction_steps` share the same per-language-key shape
// (`{ en, es, fr, hi, it, ko, pl, ru, tr, zh }`, confirmed live against the
// real instance — see PR10 plan notes): `instructions` values are a single
// paragraph, `instruction_steps` values are arrays of numbered steps. The
// Quick Reference sheet uses ONLY `instruction_steps` (via
// `lib/get-spanish-instruction-steps.ts`) — `instructions` is fetched for
// completeness/future use but not rendered by this PR. Both are typed as
// `unknown` here (not a language-keyed type) since this module has no
// generated `database.types.ts` to derive it from, and the parsing helper
// already defends against a missing/malformed shape.
export type Exercise = {
  id: string
  name: string
  category: string | null
  body_part: string | null
  equipment: string | null
  target: string | null
  muscle_group: string | null
  secondary_muscles: string[] | null
  image: string | null
  gif_url: string | null
  instructions: unknown
  instruction_steps: unknown
}

const EXERCISE_COLUMNS =
  'id, name, category, body_part, equipment, target, muscle_group, secondary_muscles, image, gif_url, instructions, instruction_steps'

// Search results are paginated (`page` is 0-indexed) instead of a single
// capped fetch — the catalog has 1300+ rows, so a one-shot `.limit()` (the
// original approach) silently hid everything past the first page with no
// way to reach it. `use-exercises.ts`'s `useExerciseSearchQuery` drives this
// with `useInfiniteQuery` for the picker's infinite scroll.
export const SEARCH_PAGE_SIZE = 30
const RELATED_LIMIT = 6

export type ExerciseFilters = {
  name?: string
  category?: string
  bodyPart?: string
  // A single raw value (`.eq`) or an array of raw values (`.in`) — the
  // array form backs the exercise-picker's "EQUIPO" category chips (each
  // visual category maps to several raw catalog values, see
  // `features/exercises/lib/equipment-category.ts`).
  equipment?: string | string[]
}

// Exact case-insensitive name matches pinned to the top of page 0 — a
// handful at most (the catalog may hold the same name per equipment).
const EXACT_MATCH_LIMIT = 5

export type ExerciseSearchPage = {
  exercises: Exercise[]
  // Whether the paged query returned a full page — the exact-match rows
  // added to page 0 never count towards it.
  hasMore: boolean
}

// Non-name filters, shared by the paged query and the exact-match query.
function filteredExercisesQuery(filters: ExerciseFilters) {
  let query = db.from('exercises').select(EXERCISE_COLUMNS)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.bodyPart) query = query.eq('body_part', filters.bodyPart)
  if (Array.isArray(filters.equipment)) {
    if (filters.equipment.length > 0) query = query.in('equipment', filters.equipment)
  } else if (filters.equipment) {
    query = query.eq('equipment', filters.equipment)
  }
  return query
}

// RLS does not apply to `exercises` (shared, read-only catalog) — no user_id
// scoping is relevant here, unlike the owner-scoped tables in other features.
//
// With a name query, an exact (case-insensitive) name match would otherwise
// be buried among the many alphabetical "contains" matches (e.g. "run").
// So exact matches are EXCLUDED from the paged query on every page (keeps
// `.range()` pagination consistent, no duplicates on later pages) and
// fetched separately, then prepended, on page 0 only.
export async function searchExercises(filters: ExerciseFilters = {}, page = 0): Promise<ExerciseSearchPage> {
  const name = filters.name?.trim()
  const exactPattern = name ? escapeLikePattern(name) : null

  let query = filteredExercisesQuery(filters).order('name', { ascending: true })
  if (exactPattern) query = query.ilike('name', `%${exactPattern}%`).not('name', 'ilike', exactPattern)

  const from = page * SEARCH_PAGE_SIZE
  query = query.range(from, from + SEARCH_PAGE_SIZE - 1)

  const exactQuery =
    exactPattern && page === 0
      ? filteredExercisesQuery(filters)
          .ilike('name', exactPattern)
          .order('name', { ascending: true })
          .limit(EXACT_MATCH_LIMIT)
      : null

  const [pagedResult, exactResult] = await Promise.all([query, exactQuery])
  if (pagedResult.error) throw pagedResult.error
  if (exactResult?.error) throw exactResult.error

  const paged = (pagedResult.data as Exercise[] | null) ?? []
  const exact = (exactResult?.data as Exercise[] | null | undefined) ?? []
  const exactIds = new Set(exact.map((exercise) => exercise.id))

  return {
    exercises: [...exact, ...paged.filter((exercise) => !exactIds.has(exercise.id))],
    hasMore: paged.length === SEARCH_PAGE_SIZE,
  }
}

// "Related" = same `target`, excluding the exercise the picker was opened
// from, capped to a short suggestion list. Not `muscle_group`: that catalog
// column is unreliable (e.g. lateral raise → traps).
export async function fetchRelatedExercises(target: string, excludeId: string): Promise<Exercise[]> {
  const { data, error } = await db
    .from('exercises')
    .select(EXERCISE_COLUMNS)
    .eq('target', target)
    .neq('id', excludeId)
    .limit(RELATED_LIMIT)

  if (error) throw error
  return (data as Exercise[] | null) ?? []
}

// Single exercise lookup — backs `features/exercises/pages/exercise-detail-page.tsx`
// (title + metadata for `/exercises/:id`).
export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await db.from('exercises').select(EXERCISE_COLUMNS).eq('id', id).maybeSingle()

  if (error) throw error
  return (data as Exercise | null) ?? null
}

// Batch lookup by id — backs displaying exercise names for a workout's
// `workout_exercises` (which only store `exercise_id`), e.g. the finished
// workout breakdown on `/workout/:id/summary`.
export async function fetchExercisesByIds(ids: string[]): Promise<Exercise[]> {
  if (ids.length === 0) return []

  const { data, error } = await db.from('exercises').select(EXERCISE_COLUMNS).in('id', ids)

  if (error) throw error
  return (data as Exercise[] | null) ?? []
}

// `exercise_focus` (migration 0011) is a shared, read-only catalog table:
// the specific muscle region an exercise emphasizes most (e.g. lateral vs
// posterior deltoid). One row per exercise at most; many exercises have none.
export type ExerciseFocus = {
  focus: string
  confidence: FocusConfidence
  is_stretch: boolean
}

const FOCUS_COLUMNS = 'focus, confidence, is_stretch'
// How many rows each similar-exercises source fetches before ranking — a
// small over-fetch so filtering (low confidence, stretch mismatch, dedupe)
// still leaves enough to fill the final list.
const SIMILAR_CANDIDATE_LIMIT = 12

export async function fetchExerciseFocus(exerciseId: string): Promise<ExerciseFocus | null> {
  const { data, error } = await db.from('exercise_focus').select(FOCUS_COLUMNS).eq('exercise_id', exerciseId).maybeSingle()

  if (error) throw error
  return (data as ExerciseFocus | null) ?? null
}

type FocusCandidateRow = ExerciseFocus & { exercises: Exercise | Exercise[] | null }

// The embedded `exercises(...)` relation is to-one (FK on `exercise_id`), so
// PostgREST returns an object — but tolerate the array shape the untyped
// client may also yield.
function toFocusCandidate(row: FocusCandidateRow): FocusCandidate<Exercise> | null {
  const exercise = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises
  if (!exercise) return null
  return { exercise, focus: row.focus, confidence: row.confidence, is_stretch: row.is_stretch }
}

async function fetchSameFocusCandidates(focus: string, excludeId: string): Promise<FocusCandidate<Exercise>[]> {
  const { data, error } = await db
    .from('exercise_focus')
    .select(`${FOCUS_COLUMNS}, exercises(${EXERCISE_COLUMNS})`)
    .eq('focus', focus)
    .neq('exercise_id', excludeId)
    .limit(SIMILAR_CANDIDATE_LIMIT)

  if (error) throw error
  return ((data as FocusCandidateRow[] | null) ?? [])
    .map(toFocusCandidate)
    .filter((candidate): candidate is FocusCandidate<Exercise> => candidate !== null)
}

async function fetchSameTargetCandidates(target: string | null, excludeId: string): Promise<Exercise[]> {
  if (!target) return []

  const { data, error } = await db
    .from('exercises')
    .select(EXERCISE_COLUMNS)
    .eq('target', target)
    .neq('id', excludeId)
    .limit(SIMILAR_CANDIDATE_LIMIT)

  if (error) throw error
  return (data as Exercise[] | null) ?? []
}

// Backs the Quick Reference sheet's "Ejercicios similares". Graceful
// degradation: any `exercise_focus` failure (e.g. migration 0011 not yet
// applied → PostgREST "relation does not exist") is treated as "no focus",
// so the list still falls back to same-`target` exercises instead of
// failing. Only the `exercises` query can throw.
export async function fetchSimilarExercises(
  exercise: Exercise,
  limit = DEFAULT_SIMILAR_LIMIT,
): Promise<SimilarExercise<Exercise>[]> {
  const currentFocus = await fetchExerciseFocus(exercise.id).catch(() => null)

  const [focusCandidates, targetCandidates] = await Promise.all([
    currentFocus
      ? fetchSameFocusCandidates(currentFocus.focus, exercise.id).catch(() => [])
      : Promise.resolve([]),
    fetchSameTargetCandidates(exercise.target, exercise.id),
  ])

  return pickSimilarExercises({
    currentId: exercise.id,
    currentFocus,
    focusCandidates,
    targetCandidates,
    limit,
  })
}
