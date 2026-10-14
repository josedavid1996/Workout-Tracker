// Swapping an exercise for another one mid-session.

export type ExerciseSwapPlan = {
  // false when the original already has completed sets: that work is kept
  // and the replacement goes right after it.
  removeOriginal: boolean
  insertPosition: number
  // Later exercises that must move down one slot to make room.
  shifts: { id: string; position: number }[]
  // Set rows to pre-fill for the replacement.
  setCount: number
  reps: number | null
}

export function planExerciseSwap({
  target,
  others,
}: {
  target: { id: string; position: number; sets: { completed: boolean; reps: number }[] }
  others: { id: string; position: number }[]
}): ExerciseSwapPlan {
  const setCount = target.sets.length
  const reps = target.sets[0]?.reps ?? null

  if (!target.sets.some((set) => set.completed)) {
    return { removeOriginal: true, insertPosition: target.position, shifts: [], setCount, reps }
  }

  return {
    removeOriginal: false,
    insertPosition: target.position + 1,
    shifts: others
      .filter((other) => other.position > target.position)
      .map((other) => ({ id: other.id, position: other.position + 1 })),
    setCount,
    reps,
  }
}
