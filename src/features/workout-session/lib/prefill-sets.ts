import { FALLBACK_REPS, parsePlannedRepsLowerBound } from './new-set-defaults'

// Set rows created up-front when a workout starts from a routine, so logging
// a set is "check what was planned" instead of "create a row, then confirm".

export type PreviousSet = { weight: number; reps: number }

// `weight: null` = no history to prefill from — stored as 0 and shown empty
// until the user types a value (see `weight-missing.ts`).
export type PrefilledSet = { weight: number | null; reps: number }

export type PrefillInput = {
  targetSets: number | null
  targetReps: string | null
  // The same exercise's countable sets from its most recent other workout,
  // in the order they were done.
  previousSets: PreviousSet[]
}

// Row count: the routine's `target_sets`, else as many sets as last time.
// Weight: the matching set from last time (the last one repeats when the
// plan now has more sets). Reps: the plan's lower bound, else last time's.
export function buildPrefilledSets({ targetSets, targetReps, previousSets }: PrefillInput): PrefilledSet[] {
  const count = targetSets ?? previousSets.length
  if (count <= 0) return []

  const plannedReps = parsePlannedRepsLowerBound(targetReps)
  const lastPrevious = previousSets.at(-1) ?? null

  return Array.from({ length: count }, (_, index) => {
    const previous = previousSets[index] ?? lastPrevious
    return {
      weight: previous?.weight ?? null,
      reps: plannedReps ?? previous?.reps ?? FALLBACK_REPS,
    }
  })
}

export type CountableSetRow = {
  workout_id: string
  weight: number
  reps: number
  completed_at: string | null
}

function completedTime(row: CountableSetRow): number {
  return new Date(row.completed_at ?? 0).getTime()
}

// Picks, out of every countable set of one exercise, the sets of the most
// recent workout other than `excludeWorkoutId`, oldest-first.
export function pickPreviousSessionSets(rows: CountableSetRow[], excludeWorkoutId: string): PreviousSet[] {
  const candidates = rows.filter((row) => row.workout_id !== excludeWorkoutId)
  if (candidates.length === 0) return []

  const latest = candidates.reduce((best, row) => (completedTime(row) > completedTime(best) ? row : best))

  return candidates
    .filter((row) => row.workout_id === latest.workout_id)
    .sort((a, b) => completedTime(a) - completedTime(b))
    .map((row) => ({ weight: row.weight, reps: row.reps }))
}
