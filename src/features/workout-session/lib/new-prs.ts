import type { CountableSet } from '../../../shared/lib/countable-set'
import { estimateOneRm } from '../../../shared/lib/one-rm'
import { bestOverall } from '../../../shared/lib/records'

export type NewPr = {
  exerciseId: string
  set: CountableSet
}

// Backs the "Nuevo PR" banner on `/workout/:id/summary`
// (`design/figma-reference/07-resumen-post-workout.md`): for each exercise
// logged in the current session, compares its best set (by estimated 1RM,
// `shared/lib/records.ts#bestOverall` + `one-rm.ts`, both PR2, reused as-is)
// against that exercise's best set from every OTHER session. No historical
// sets at all for an exercise still counts as a PR (first time logging it).
export function detectNewPrs(
  currentSetsByExercise: Map<string, CountableSet[]>,
  historicalSetsByExercise: Map<string, CountableSet[]>,
): NewPr[] {
  const results: NewPr[] = []

  for (const [exerciseId, currentSets] of currentSetsByExercise) {
    const currentBest = bestOverall(currentSets)
    if (!currentBest) continue

    const historicalBest = bestOverall(historicalSetsByExercise.get(exerciseId) ?? [])
    const currentScore = estimateOneRm(currentBest.weight, currentBest.reps)?.value ?? 0
    const historicalScore = historicalBest
      ? (estimateOneRm(historicalBest.weight, historicalBest.reps)?.value ?? 0)
      : -Infinity

    if (currentScore > historicalScore) {
      results.push({ exerciseId, set: currentBest })
    }
  }

  return results
}
