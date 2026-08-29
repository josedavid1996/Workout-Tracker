import type { CountableSet } from './countable-set'
import { estimateOneRm } from './one-rm'

// Operates on CountableSet[] for a single exercise, already fetched/filtered.

// "Best overall" is the set with the highest estimated 1RM (via
// `estimateOneRm`), not the highest raw weight*reps. A high-rep set is a
// better representation of true strength once normalized to 1RM than raw
// volume is (e.g. 120kg x 5 > 100kg x 10 in real strength terms, even though
// the second has more raw volume). Sets whose 1RM is undefined (reps >= 37)
// are treated as a score of 0 so they never win over a set with a valid
// estimate, but they can still win by default if every set is >= 37 reps.
export function bestOverall(sets: CountableSet[]): CountableSet | null {
  if (sets.length === 0) return null

  let best: CountableSet | null = null
  let bestScore = -Infinity

  for (const set of sets) {
    const score = estimateOneRm(set.weight, set.reps)?.value ?? 0
    if (score > bestScore) {
      bestScore = score
      best = set
    }
  }

  return best
}

// Best (heaviest) weight lifted for each exact rep count seen.
export function bestByRepCount(sets: CountableSet[]): Map<number, CountableSet> {
  const byReps = new Map<number, CountableSet>()

  for (const set of sets) {
    const current = byReps.get(set.reps)
    if (!current || set.weight > current.weight) {
      byReps.set(set.reps, set)
    }
  }

  return byReps
}

export type ProjectedBest = {
  value: number
  lowConfidence: boolean
} | null

// Projects the weight achievable for `targetReps` from the best historical
// 1RM across all sets, using the Brzycki formula inverted:
// weight = 1RM * (37 - targetReps) / 36.
// `lowConfidence` mirrors `estimateOneRm`'s rule: true once targetReps > 12.
export function projectedBest(sets: CountableSet[], targetReps: number): ProjectedBest {
  let bestOneRm: number | null = null

  for (const set of sets) {
    const estimate = estimateOneRm(set.weight, set.reps)
    if (estimate && (bestOneRm === null || estimate.value > bestOneRm)) {
      bestOneRm = estimate.value
    }
  }

  if (bestOneRm === null) return null

  return {
    value: (bestOneRm * (37 - targetReps)) / 36,
    lowConfidence: targetReps > 12,
  }
}
