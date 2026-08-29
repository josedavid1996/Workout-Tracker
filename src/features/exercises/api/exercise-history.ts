import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'
import type { SetEntry } from '../../workout-session/api/workout-session'

// Same untyped-client cast used across other feature `api/` modules until
// `database.types.ts` is generated — see `features/routines/api/routines.ts`.
const db = supabase as unknown as SupabaseClient

// Same shape as `SetEntry` (workout-session feature) plus the owning
// workout's `created_at`, so history/records/chart views can sort and
// display chronologically without a second round-trip per row.
export type ExerciseSetHistoryEntry = SetEntry & { workout_created_at: string }

const SET_COLUMNS = 'id, workout_exercise_id, workout_id, exercise_id, weight, reps, tag, completed, completed_at'

// Every set entry for one exercise (any tag, completed or not) — unlike the
// `countable_sets()` RPC (0004_functions.sql), this is intentionally
// unfiltered so the exercise-detail History tab can show the full log.
// Callers still apply `isCountable` themselves before using these for
// records/chart math (see `shared/lib/countable-set.ts`).
//
// Two-step fetch instead of PostgREST embedding: `set_entries` only has a
// composite FK to `workout_exercises` (see 0001_core_schema.sql), not a
// direct one to `workouts`, so embedding `workouts(created_at)` in a single
// query is not reliably resolvable. Fetching the distinct workout rows
// separately and joining client-side avoids that ambiguity.
export async function fetchExerciseSetHistory(exerciseId: string): Promise<ExerciseSetHistoryEntry[]> {
  const { data: setRows, error: setError } = await db.from('set_entries').select(SET_COLUMNS).eq('exercise_id', exerciseId)

  if (setError) throw setError

  const sets = (setRows as SetEntry[] | null) ?? []
  if (sets.length === 0) return []

  const workoutIds = Array.from(new Set(sets.map((set) => set.workout_id)))

  const { data: workoutRows, error: workoutError } = await db.from('workouts').select('id, created_at').in('id', workoutIds)

  if (workoutError) throw workoutError

  const createdAtById = new Map(
    ((workoutRows as { id: string; created_at: string }[] | null) ?? []).map((workout) => [
      workout.id,
      workout.created_at,
    ]),
  )

  return sets
    .map((set) => ({ ...set, workout_created_at: createdAtById.get(set.workout_id) ?? '' }))
    .sort((a, b) => new Date(b.workout_created_at).getTime() - new Date(a.workout_created_at).getTime())
}
