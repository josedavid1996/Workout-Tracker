import type { CountableSet } from '../../../shared/lib/countable-set'
import { estimateOneRm } from '../../../shared/lib/one-rm'
import { bestOverall } from '../../../shared/lib/records'

const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000

export type EightWeekDelta = {
  deltaKg: number
  lowConfidence: boolean
} | null

// The 3rd stat-tile on `/exercises/:id` (`+N KG · 8SEM`,
// `design/figma-reference/09-detalle-ejercicio.md`) — compares the current
// best estimated 1RM (`shared/lib/records.ts#bestOverall` + `one-rm.ts`,
// both PR2, reused as-is) against the best estimated 1RM from sets logged
// 8+ weeks before `referenceIso`. Returns `null` when there is no set old
// enough to serve as a baseline (nothing to compare against yet) rather
// than fabricating a 0.
export function computeEightWeekDelta(
  sets: CountableSet[],
  referenceIso: string = new Date().toISOString(),
): EightWeekDelta {
  const cutoff = new Date(referenceIso).getTime() - EIGHT_WEEKS_MS
  const oldSets = sets.filter((set) => new Date(set.completedAt).getTime() <= cutoff)
  const recentSets = sets.filter((set) => new Date(set.completedAt).getTime() > cutoff)
  if (oldSets.length === 0 || recentSets.length === 0) return null

  const oldBest = bestOverall(oldSets)
  const currentBest = bestOverall(recentSets)
  if (!oldBest || !currentBest) return null

  const oldEstimate = estimateOneRm(oldBest.weight, oldBest.reps)
  const currentEstimate = estimateOneRm(currentBest.weight, currentBest.reps)
  if (!oldEstimate || !currentEstimate) return null

  return {
    deltaKg: Math.round((currentEstimate.value - oldEstimate.value) * 10) / 10,
    lowConfidence: oldEstimate.lowConfidence || currentEstimate.lowConfidence,
  }
}
