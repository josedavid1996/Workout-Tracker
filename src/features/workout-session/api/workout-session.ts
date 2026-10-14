import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'
import type { SetTag } from '../../../shared/lib/countable-set'
import { getUserEquipment } from '../../equipment/api/equipment'
import type { UserEquipment } from '../../equipment/api/equipment'
import type { ExerciseSwapPlan } from '../lib/exercise-swap'
import type { CountableSetRow, PreviousSet } from '../lib/prefill-sets'
import { buildPrefilledSets, pickPreviousSessionSets } from '../lib/prefill-sets'

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
// `exercise_id` (positions can shift once exercises are added or swapped
// mid-session).
export type RoutineTarget = {
  exercise_id: string
  position: number
  target_sets: number | null
  target_reps: string | null
  notes: string | null
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

type RoutineExerciseRow = {
  exercise_id: string
  position: number
  target_sets: number | null
  target_reps: string | null
}

// Creates the `workouts` row and, when started from a routine, pre-populates
// `workout_exercises` in the routine's order plus their set rows (see
// `prefillSetRows`). Freestyle (`routineId: null`) starts with no exercises —
// they are added one at a time via `addWorkoutExercise`.
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
      .select('exercise_id, position, target_sets, target_reps')
      .eq('routine_id', routineId)
      .order('position', { ascending: true })

    if (routineExercisesError) throw routineExercisesError

    const planned = (routineExercises as RoutineExerciseRow[] | null) ?? []
    const rows = planned.map((row) => ({
      workout_id: (workout as Workout).id,
      exercise_id: row.exercise_id,
      position: row.position,
      user_id: userId,
    }))

    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await db
        .from('workout_exercises')
        .insert(rows)
        .select('id, exercise_id, position')
      if (insertError) throw insertError

      const targetsByPosition = new Map(planned.map((row) => [row.position, row]))
      await prefillSetRows(
        userId,
        (workout as Workout).id,
        ((inserted as Pick<WorkoutExercise, 'id' | 'exercise_id' | 'position'>[] | null) ?? []).map((row) => ({
          workoutExerciseId: row.id,
          exerciseId: row.exercise_id,
          targetSets: targetsByPosition.get(row.position)?.target_sets ?? null,
          targetReps: targetsByPosition.get(row.position)?.target_reps ?? null,
        })),
      )
    }
  }

  return workout as Workout
}

type PrefillTarget = {
  workoutExerciseId: string
  exerciseId: string
  targetSets: number | null
  targetReps: string | null
}

// Creates the pending set rows of freshly added exercises, so logging is
// "check what was planned" (`lib/prefill-sets.ts` holds the rules). A failed
// history lookup only costs the weight prefill — the rows are still created.
async function prefillSetRows(userId: string, workoutId: string, targets: PrefillTarget[]): Promise<void> {
  const setRows = (
    await Promise.all(
      targets.map(async (target) => {
        const previousSets = await getPreviousSessionSets(target.exerciseId, workoutId).catch(() => [])
        return buildPrefilledSets({
          targetSets: target.targetSets,
          targetReps: target.targetReps,
          previousSets,
        }).map((set) => ({
          workout_exercise_id: target.workoutExerciseId,
          workout_id: workoutId,
          exercise_id: target.exerciseId,
          // NOT NULL column — an unknown weight is stored as 0 and shown
          // empty until typed (`lib/session-sets.ts#isWeightMissing`).
          weight: set.weight ?? 0,
          reps: set.reps,
          tag: 'normal' as const,
          completed: false,
          user_id: userId,
        }))
      }),
    )
  ).flat()

  if (setRows.length === 0) return

  const { error } = await db.from('set_entries').insert(setRows)
  if (error) throw error
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
    .select('exercise_id, position, target_sets, target_reps, notes')
    .eq('routine_id', routineId)
    .order('position', { ascending: true })

  if (error) throw error
  return (data as RoutineTarget[] | null) ?? []
}

// Adds an exercise to an open workout, with as many pending set rows as it
// had last time (none when it has no history — the user adds them).
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

  const created = data as WorkoutExercise
  await prefillSetRows(userId, workoutId, [
    { workoutExerciseId: created.id, exerciseId, targetSets: null, targetReps: null },
  ])
  return created
}

// `set_entries` rows go with it (`on delete cascade`).
export async function removeWorkoutExercise(workoutExerciseId: string): Promise<void> {
  const { error } = await db.from('workout_exercises').delete().eq('id', workoutExerciseId)
  if (error) throw error
}

export type ReplaceWorkoutExerciseParams = {
  workoutId: string
  workoutExerciseId: string
  newExerciseId: string
  // From `lib/exercise-swap.ts#planExerciseSwap`.
  plan: ExerciseSwapPlan
}

// Swaps an exercise for another one following `plan`: either in place
// (nothing was logged yet) or right after the original (its completed sets
// are kept). The replacement gets the same number of pending set rows.
export async function replaceWorkoutExercise({
  workoutId,
  workoutExerciseId,
  newExerciseId,
  plan,
}: ReplaceWorkoutExerciseParams): Promise<WorkoutExercise> {
  const userId = await requireUserId()

  if (plan.removeOriginal) {
    await removeWorkoutExercise(workoutExerciseId)
  }

  for (const shift of plan.shifts) {
    const { error } = await db.from('workout_exercises').update({ position: shift.position }).eq('id', shift.id)
    if (error) throw error
  }

  const { data, error } = await db
    .from('workout_exercises')
    .insert({ workout_id: workoutId, exercise_id: newExerciseId, position: plan.insertPosition, user_id: userId })
    .select('id, workout_id, exercise_id, position')
    .single()

  if (error) throw error

  const created = data as WorkoutExercise
  await prefillSetRows(userId, workoutId, [
    {
      workoutExerciseId: created.id,
      exerciseId: newExerciseId,
      targetSets: plan.setCount,
      targetReps: plan.reps === null ? null : String(plan.reps),
    },
  ])
  return created
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

export async function deleteSet(id: string): Promise<void> {
  const { error } = await db.from('set_entries').delete().eq('id', id)
  if (error) throw error
}

// Throws away a workout started by mistake, with its exercises and sets
// (`on delete cascade`). Scoped to unfinished workouts so it can never
// delete history.
export async function discardWorkout(workoutId: string): Promise<void> {
  const { error } = await db.from('workouts').delete().eq('id', workoutId).is('finished_at', null)
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

// What was done last time for one exercise: the countable sets of its most
// recent workout other than `excludeWorkoutId`, oldest-first. Same RPC and
// client-side exclusion as `getLastLoggedWeight` above.
export async function getPreviousSessionSets(exerciseId: string, excludeWorkoutId: string): Promise<PreviousSet[]> {
  const { data, error } = await db.rpc('countable_sets', { p_exercise_id: exerciseId })
  if (error) throw error

  return pickPreviousSessionSets((data as CountableSetRow[] | null) ?? [], excludeWorkoutId)
}

// Re-exported from `features/equipment/api/equipment.ts` (Phase 10, PR5) —
// this function lived here first (before the equipment feature existed) and
// is kept importable from this module so `use-workout-session.ts` and
// `plate-calculator.tsx` don't need to change their imports.
export { getUserEquipment }
