import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'
import type { SetTag } from '../../../shared/lib/countable-set'
import { getUserEquipment } from '../../equipment/api/equipment'
import type { UserEquipment } from '../../equipment/api/equipment'

// Same untyped-client cast used across other feature `api/` modules until
// `database.types.ts` is generated — see `features/routines/api/routines.ts`.
const db = supabase as unknown as SupabaseClient

export type Workout = {
  id: string
  routine_id: string | null
  notes: string | null
  created_at: string
  finished_at: string | null
}

export type WorkoutExercise = {
  id: string
  workout_id: string
  exercise_id: string
  position: number
}

export type SetEntry = {
  id: string
  workout_exercise_id: string
  workout_id: string
  exercise_id: string
  weight: number
  reps: number
  tag: SetTag
  completed: boolean
  completed_at: string | null
}

export type WorkoutExerciseWithSets = WorkoutExercise & { set_entries: SetEntry[] }
export type WorkoutDetail = Workout & { workout_exercises: WorkoutExerciseWithSets[] }

// Guidance-only target from the routine this workout was started from —
// `workout_exercises` itself has no target_sets/target_reps columns, only
// the copied `exercise_id`/`position`. Matched back to a workout_exercise by
// `position` since both were populated from the same routine order.
export type RoutineTarget = {
  exercise_id: string
  position: number
  target_sets: number | null
  target_reps: string | null
}

// Re-exported for callers that already imported `UserEquipment` from here
// (see `use-workout-session.ts` / `plate-calculator.tsx`) — the canonical
// type now lives in `features/equipment/api/equipment.ts`.
export type { UserEquipment }

const WORKOUT_COLUMNS = 'id, routine_id, notes, created_at, finished_at'
const WORKOUT_DETAIL_SELECT = `${WORKOUT_COLUMNS}, workout_exercises(id, workout_id, exercise_id, position, set_entries(id, workout_exercise_id, workout_id, exercise_id, weight, reps, tag, completed, completed_at))`

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error

  const userId = data.user?.id
  if (!userId) throw new Error('Not authenticated')

  return userId
}

// Creates the `workouts` row and, when started from a routine, pre-populates
// `workout_exercises` in the routine's order. Freestyle (`routineId: null`)
// starts with no exercises — they are added one at a time via
// `addWorkoutExercise` before the first set is logged (see workout-session
// pages for that "freestyle only, before any set" rule).
export async function startWorkout(routineId: string | null): Promise<Workout> {
  const userId = await requireUserId()

  const { data: workout, error: workoutError } = await db
    .from('workouts')
    .insert({ user_id: userId, routine_id: routineId })
    .select(WORKOUT_COLUMNS)
    .single()

  if (workoutError) throw workoutError

  if (routineId) {
    const { data: routineExercises, error: routineExercisesError } = await db
      .from('routine_exercises')
      .select('exercise_id, position')
      .eq('routine_id', routineId)
      .order('position', { ascending: true })

    if (routineExercisesError) throw routineExercisesError

    const rows = ((routineExercises as { exercise_id: string; position: number }[] | null) ?? []).map((row) => ({
      workout_id: (workout as Workout).id,
      exercise_id: row.exercise_id,
      position: row.position,
      user_id: userId,
    }))

    if (rows.length > 0) {
      const { error: insertError } = await db.from('workout_exercises').insert(rows)
      if (insertError) throw insertError
    }
  }

  return workout as Workout
}

// At most one active (finished_at IS NULL) workout per user — enforced by
// `workouts_single_active_idx` (0002_indexes.sql). This is the single lookup
// used both when entering `/workout/:id` directly and when deciding whether
// to redirect away from `/workout/start` into an already-active session.
export async function resumeActiveWorkout(): Promise<Workout | null> {
  // `.is(...)`, not `.eq(...)` — PostgREST has no `eq.null` operator; SQL
  // `= NULL` is always unknown, so an `.eq('finished_at', null)` filter
  // would silently match nothing instead of finding the active workout.
  const { data, error } = await db
    .from('workouts')
    .select(WORKOUT_COLUMNS)
    .is('finished_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as Workout | null) ?? null
}

export async function fetchWorkout(id: string): Promise<WorkoutDetail> {
  const { data, error } = await db
    .from('workouts')
    .select(WORKOUT_DETAIL_SELECT)
    .eq('id', id)
    .order('position', { referencedTable: 'workout_exercises', ascending: true })
    .single()

  if (error) throw error
  return data as WorkoutDetail
}

export async function fetchRoutineTargets(routineId: string): Promise<RoutineTarget[]> {
  const { data, error } = await db
    .from('routine_exercises')
    .select('exercise_id, position, target_sets, target_reps')
    .eq('routine_id', routineId)
    .order('position', { ascending: true })

  if (error) throw error
  return (data as RoutineTarget[] | null) ?? []
}

// Adding an exercise mid-session is only allowed for freestyle workouts
// before any set has been logged (enforced by the calling page, not here —
// this function only performs the insert once that decision is made).
export async function addWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  position: number,
): Promise<WorkoutExercise> {
  const userId = await requireUserId()

  const { data, error } = await db
    .from('workout_exercises')
    .insert({ workout_id: workoutId, exercise_id: exerciseId, position, user_id: userId })
    .select('id, workout_id, exercise_id, position')
    .single()

  if (error) throw error
  return data as WorkoutExercise
}

export type LogSetParams = {
  workoutExerciseId: string
  workoutId: string
  exerciseId: string
  weight: number
  reps: number
  tag: SetTag
}

export async function logSet(params: LogSetParams): Promise<SetEntry> {
  const userId = await requireUserId()

  const { data, error } = await db
    .from('set_entries')
    .insert({
      workout_exercise_id: params.workoutExerciseId,
      workout_id: params.workoutId,
      exercise_id: params.exerciseId,
      weight: params.weight,
      reps: params.reps,
      tag: params.tag,
      completed: false,
      user_id: userId,
    })
    .select('id, workout_exercise_id, workout_id, exercise_id, weight, reps, tag, completed, completed_at')
    .single()

  if (error) throw error
  return data as SetEntry
}

export type SetPatch = Partial<Pick<SetEntry, 'weight' | 'reps' | 'tag'>>

export async function updateSet(id: string, patch: SetPatch): Promise<void> {
  const { error } = await db.from('set_entries').update(patch).eq('id', id)
  if (error) throw error
}

export async function toggleCompleted(id: string, completed: boolean): Promise<void> {
  const { error } = await db
    .from('set_entries')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) throw error
}

export async function finishWorkout(workoutId: string): Promise<void> {
  const { error } = await db
    .from('workouts')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', workoutId)

  if (error) throw error
}

// `countable_sets()` (0004_functions.sql) is the single source of truth for
// the "countable" filter (completed && tag <> 'warmup') — this never
// reimplements that filter by hand. The RPC takes only `p_exercise_id`, so
// excluding the current (in-progress) workout and picking the most recent
// entry happens client-side over its (already-filtered) result.
export async function getLastLoggedWeight(exerciseId: string, excludeWorkoutId: string): Promise<number | null> {
  const { data, error } = await db.rpc('countable_sets', { p_exercise_id: exerciseId })
  if (error) throw error

  const rows = (data as SetEntry[] | null) ?? []
  const candidates = rows
    .filter((row) => row.workout_id !== excludeWorkoutId)
    .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())

  return candidates[0]?.weight ?? null
}

// Re-exported from `features/equipment/api/equipment.ts` (Phase 10, PR5) —
// this function lived here first (before the equipment feature existed) and
// is kept importable from this module so `use-workout-session.ts` and
// `plate-calculator.tsx` don't need to change their imports.
export { getUserEquipment }
