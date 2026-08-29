import type { CountableSet } from '../../../shared/lib/countable-set'
import type { SetEntry } from '../api/workout-session'

// Maps the snake_case API row into the camelCase `CountableSet` shape that
// `shared/lib/volume.ts`'s `sessionVolume` expects. Callers must still apply
// `isCountable` themselves before summing — this function only reshapes.
export function toCountableSet(entry: SetEntry): CountableSet {
  return {
    id: entry.id,
    exerciseId: entry.exercise_id,
    weight: entry.weight,
    reps: entry.reps,
    completedAt: entry.completed_at ?? '',
    workoutId: entry.workout_id,
  }
}
