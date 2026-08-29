import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'
import type { RoutineExerciseDraft } from './routine-exercises-payload'
import { toRoutineExerciseRows } from './routine-exercises-payload'

// `client.ts`'s `Database` type is a placeholder (`Record<string, unknown>`)
// until real types are generated (see `shared/supabase/README.md`) — that
// placeholder makes `.insert()`/`.update()` argument types collapse to
// `never`. `db` is the same runtime client, loosely typed via the untyped
// `SupabaseClient` default (`Database = any`) so query builders here type-
// check normally. Remove this cast once `database.types.ts` exists and
// `client.ts` is wired to the real `Database` type.
const db = supabase as unknown as SupabaseClient

export type Routine = {
  id: string
  name: string
  created_at: string
}

export type RoutineExercise = {
  id: string
  routine_id: string
  exercise_id: string
  position: number
  target_sets: number | null
  target_reps: string | null
}

export type RoutineWithExercises = Routine & { routine_exercises: RoutineExercise[] }

const ROUTINE_EXERCISE_COLUMNS = 'id, routine_id, exercise_id, position, target_sets, target_reps'

// RLS (`auth.uid() = user_id`) already scopes every one of these queries to
// the current user — no client-side `user_id` filter is added on reads.
export async function fetchRoutines(): Promise<Routine[]> {
  const { data, error } = await db
    .from('routines')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Routine[] | null) ?? []
}

// All of the current user's routines, each with its `routine_exercises`
// nested (ordered by position) — backs `/routines`' real card layout
// (exercise count/names, dominant body part for the filter tabs) and
// Home's "hoy toca" fallback (see `features/routines/pages/routines-list-page.tsx`
// and `features/home/pages/home-page.tsx`). Unlike `fetchRoutines`, this
// does one richer query instead of one row per routine — reasonable at this
// scale (a user's own routine list).
export async function fetchRoutinesWithExercises(): Promise<RoutineWithExercises[]> {
  const { data, error } = await db
    .from('routines')
    .select(`id, name, created_at, routine_exercises(${ROUTINE_EXERCISE_COLUMNS})`)
    .order('created_at', { ascending: false })
    .order('position', { referencedTable: 'routine_exercises', ascending: true })

  if (error) throw error
  return (data as RoutineWithExercises[] | null) ?? []
}

export async function fetchRoutine(id: string): Promise<RoutineWithExercises> {
  const { data, error } = await db
    .from('routines')
    .select(`id, name, created_at, routine_exercises(${ROUTINE_EXERCISE_COLUMNS})`)
    .eq('id', id)
    .order('position', { referencedTable: 'routine_exercises', ascending: true })
    .single()

  if (error) throw error
  return data as RoutineWithExercises
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error

  const userId = data.user?.id
  if (!userId) throw new Error('Not authenticated')

  return userId
}

export async function createRoutine(name: string, exercises: RoutineExerciseDraft[]): Promise<Routine> {
  const userId = await requireUserId()

  const { data: routine, error: routineError } = await db
    .from('routines')
    .insert({ name, user_id: userId })
    .select('id, name, created_at')
    .single()

  if (routineError) throw routineError

  if (exercises.length > 0) {
    const routineId = (routine as Routine).id
    const rows = toRoutineExerciseRows(routineId, userId, exercises)
    const { error: exercisesError } = await db.from('routine_exercises').insert(rows)
    if (exercisesError) throw exercisesError
  }

  return routine as Routine
}

// Simplest correct approach for this PR: replace all of a routine's
// `routine_exercises` rows on every save (delete + reinsert) instead of
// diffing adds/removes/reorders individually. Fine at this scale; revisit
// if routines grow large or this becomes a perf/UX issue.
export async function updateRoutine(
  id: string,
  name: string,
  exercises: RoutineExerciseDraft[],
): Promise<void> {
  const userId = await requireUserId()

  const { error: renameError } = await db.from('routines').update({ name }).eq('id', id)
  if (renameError) throw renameError

  const { error: deleteError } = await db.from('routine_exercises').delete().eq('routine_id', id)
  if (deleteError) throw deleteError

  if (exercises.length > 0) {
    const rows = toRoutineExerciseRows(id, userId, exercises)
    const { error: insertError } = await db.from('routine_exercises').insert(rows)
    if (insertError) throw insertError
  }
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await db.from('routines').delete().eq('id', id)
  if (error) throw error
}
