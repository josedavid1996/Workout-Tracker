// "Balance muscular": how many countable sets each main muscle got in a
// period, to spot what is being over- or under-trained.

export type MuscleSetRow = { focus: string | null; target: string | null }
export type MuscleSetCount = { muscle: string; sets: number }

// `rows` is one entry per countable set. `labelFor` resolves a set's main
// muscle label (the caller passes `primaryMuscleLabel`): the exercise's
// focus tag when it has one, else its catalog target. Sets that resolve to
// no label are left out. Most trained first; ties in alphabetical order.
export function countSetsByMuscle(
  rows: MuscleSetRow[],
  labelFor: (focus: string | null, target: string | null) => string,
): MuscleSetCount[] {
  const counts = new Map<string, number>()

  for (const row of rows) {
    const muscle = labelFor(row.focus, row.target)
    if (!muscle) continue
    counts.set(muscle, (counts.get(muscle) ?? 0) + 1)
  }

  return Array.from(counts, ([muscle, sets]) => ({ muscle, sets })).sort(
    (a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle),
  )
}
