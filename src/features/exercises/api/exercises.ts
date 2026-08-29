import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'

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

// Result set is capped — this backs an interactive picker, not a full browse/export view.
const SEARCH_LIMIT = 50
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

// RLS does not apply to `exercises` (shared, read-only catalog) — no user_id
// scoping is relevant here, unlike the owner-scoped tables in other features.
export async function searchExercises(filters: ExerciseFilters = {}): Promise<Exercise[]> {
  let query = db.from('exercises').select(EXERCISE_COLUMNS).order('name', { ascending: true }).limit(SEARCH_LIMIT)

  const name = filters.name?.trim()
  if (name) query = query.ilike('name', `%${name}%`)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.bodyPart) query = query.eq('body_part', filters.bodyPart)
  if (Array.isArray(filters.equipment)) {
    if (filters.equipment.length > 0) query = query.in('equipment', filters.equipment)
  } else if (filters.equipment) {
    query = query.eq('equipment', filters.equipment)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as Exercise[] | null) ?? []
}

// "Related" = same `muscle_group`, excluding the exercise the picker was
// opened from, capped to a short suggestion list.
export async function fetchRelatedExercises(muscleGroup: string, excludeId: string): Promise<Exercise[]> {
  const { data, error } = await db
    .from('exercises')
    .select(EXERCISE_COLUMNS)
    .eq('muscle_group', muscleGroup)
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
