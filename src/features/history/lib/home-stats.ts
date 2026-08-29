import type { CountableSet } from '../../../shared/lib/countable-set'
import { bestOverall } from '../../../shared/lib/records'
import { sessionVolume } from '../../../shared/lib/volume'

export type HomeStats = {
  sessions: number
  volumeKg: number
  prCount: number
}

export type HomeStatsWorkout = {
  id: string
  // Already `isCountable`-filtered + mapped `CountableSet[]` for this workout.
  sets: CountableSet[]
}

// Heuristic (documented, per 01-home.md's "Datos reales a conectar" note):
// "PRs" = number of distinct exercises whose all-time best estimated-1RM
// set (via `shared/lib/records.ts#bestOverall`, the SAME function backing
// the exercise-detail Records tab) was logged in the MOST RECENT finished
// workout. This approximates "new personal records set this session"
// without a dedicated PR-tracking column/table, reusing existing pure
// logic instead of inventing a new heavier "is this a new PR" model.
//
// `workouts` MUST be ordered newest-first by the caller (matches
// `fetchWorkoutHistory`'s existing `created_at desc` ordering) — this
// function does not sort, it trusts `workouts[0]` is the most recent.
export function computeHomeStats(workouts: HomeStatsWorkout[]): HomeStats {
  const allSets = workouts.flatMap((workout) => workout.sets)
  const volumeKg = sessionVolume(allSets)

  const mostRecentWorkoutId = workouts[0]?.id
  const setsByExercise = new Map<string, CountableSet[]>()

  for (const set of allSets) {
    const list = setsByExercise.get(set.exerciseId)
    if (list) {
      list.push(set)
    } else {
      setsByExercise.set(set.exerciseId, [set])
    }
  }

  let prCount = 0
  if (mostRecentWorkoutId) {
    for (const sets of setsByExercise.values()) {
      const best = bestOverall(sets)
      if (best && best.workoutId === mostRecentWorkoutId) prCount += 1
    }
  }

  return { sessions: workouts.length, volumeKg, prCount }
}
