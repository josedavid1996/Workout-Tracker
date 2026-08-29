export type RoutineExerciseDraft = {
  exerciseId: string
  targetSets: number | null
  targetReps: string | null
}

export type RoutineExerciseRow = {
  routine_id: string
  user_id: string
  exercise_id: string
  position: number
  target_sets: number | null
  target_reps: string | null
}

// Recomputes `position` (0-based) from the draft list's array order right
// before persisting. The UI only ever reorders the in-memory draft list —
// this is the single place that turns that order into the `position`
// column write for `routine_exercises`.
export function toRoutineExerciseRows(
  routineId: string,
  userId: string,
  exercises: RoutineExerciseDraft[],
): RoutineExerciseRow[] {
  return exercises.map((exercise, index) => ({
    routine_id: routineId,
    user_id: userId,
    exercise_id: exercise.exerciseId,
    position: index,
    target_sets: exercise.targetSets,
    target_reps: exercise.targetReps,
  }))
}
