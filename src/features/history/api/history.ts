import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'
import { isCountable } from '../../../shared/lib/countable-set'
import { sessionVolume } from '../../../shared/lib/volume'
import type { SetEntry } from '../../workout-session/api/workout-session'
import { formatDuration } from '../../workout-session/lib/format-duration'
import { toCountableSet } from '../../workout-session/lib/to-countable-set'
import type { HomeStats } from '../lib/home-stats'
import { computeHomeStats } from '../lib/home-stats'

// Same untyped-client cast used across other feature `api/` modules until
// `database.types.ts` is generated — see `features/routines/api/routines.ts`.
const db = supabase as unknown as SupabaseClient

export type WorkoutHistoryItem = {
  id: string
  routineId: string | null
  routineName: string | null
  createdAt: string
  finishedAt: string
  duration: string
  volume: number
  // Countable sets only (same filter as `volume`) — backs the "N SETS" label
  // on the history week-list rows (`design/figma-reference/08-historial-general.md`).
  setsCount: number
}

const WORKOUT_COLUMNS = 'id, routine_id, created_at, finished_at'
const SET_ENTRY_COLUMNS =
  'id, workout_exercise_id, workout_id, exercise_id, weight, reps, tag, completed, completed_at'
const HISTORY_SELECT = `${WORKOUT_COLUMNS}, workout_exercises(set_entries(${SET_ENTRY_COLUMNS}))`

type HistoryRow = {
  id: string
  routine_id: string | null
  created_at: string
  finished_at: string
  workout_exercises: { set_entries: SetEntry[] }[]
}

// Finished workouts only (`finished_at IS NOT NULL`) — the currently active
// workout, if any, is fetched separately by the history page (via
// `useActiveWorkoutQuery` from the `workout-session` feature) and shown
// apart from this chronological list, never mixed into it. Ordered
// newest-first.
//
// Routine names are joined client-side with a second, small query by id
// instead of embedding `routines(name)` in the same select: `workouts` only
// has a composite FK to `routines` (`(routine_id, user_id)` —
// 0001_core_schema.sql), and unlike the `workout_exercises`/`set_entries`
// nesting below (already relied on the same way in
// `workout-session.ts#fetchWorkout`), this codebase has no existing
// precedent embedding across that specific relationship.
// Shared by `fetchWorkoutHistory` and `fetchHomeStats` — both need the same
// finished-workouts-newest-first rows with nested sets, just aggregated
// differently. Kept as a single query so the two never drift.
async function fetchFinishedWorkoutRows(): Promise<HistoryRow[]> {
  const { data, error } = await db
    .from('workouts')
    .select(HISTORY_SELECT)
    .not('finished_at', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as HistoryRow[] | null) ?? []
}

export async function fetchWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  const rows = await fetchFinishedWorkoutRows()
  if (rows.length === 0) return []

  const routineIds = Array.from(
    new Set(rows.map((row) => row.routine_id).filter((routineId): routineId is string => routineId !== null)),
  )
  const routineNameById = await fetchRoutineNamesById(routineIds)

  return rows.map((row) => {
    const allSets = row.workout_exercises.flatMap((workoutExercise) => workoutExercise.set_entries)
    const countableSets = allSets.filter(isCountable).map(toCountableSet)

    return {
      id: row.id,
      routineId: row.routine_id,
      routineName: row.routine_id ? routineNameById.get(row.routine_id) ?? null : null,
      createdAt: row.created_at,
      finishedAt: row.finished_at,
      duration: formatDuration(row.created_at, row.finished_at),
      volume: sessionVolume(countableSets),
      setsCount: countableSets.length,
    }
  })
}

async function fetchRoutineNamesById(routineIds: string[]): Promise<Map<string, string>> {
  if (routineIds.length === 0) return new Map()

  const { data, error } = await db.from('routines').select('id, name').in('id', routineIds)
  if (error) throw error

  return new Map(
    ((data as { id: string; name: string }[] | null) ?? []).map((routine) => [routine.id, routine.name]),
  )
}

// Backs the Home dashboard's 3 stat tiles (Sesiones/Volumen/PRs) — reuses
// the exact same finished-workout rows as `fetchWorkoutHistory` (same
// query), just aggregated by the pure `computeHomeStats` instead of mapped
// to per-workout summary items. See `features/history/lib/home-stats.ts`
// for the documented "PRs" heuristic.
export async function fetchHomeStats(): Promise<HomeStats> {
  const rows = await fetchFinishedWorkoutRows()

  const workouts = rows.map((row) => ({
    id: row.id,
    sets: row.workout_exercises
      .flatMap((workoutExercise) => workoutExercise.set_entries)
      .filter(isCountable)
      .map(toCountableSet),
  }))

  return computeHomeStats(workouts)
}
