import type { CountableSet } from '../../../shared/lib/countable-set'
import { estimateOneRm } from '../../../shared/lib/one-rm'

export type ExerciseChartPoint = {
  date: string
  weight: number
  reps: number
  volume: number
  oneRm: number | null
  lowConfidence: boolean
}

// Reshapes already-countable sets (see `shared/lib/countable-set.ts#isCountable`)
// into chart-ready points, sorted oldest-first (left-to-right on a time
// axis). `oneRm`/`lowConfidence` reuse `estimateOneRm` (Brzycki, PR2) as-is
// — `lowConfidence` points are still returned (never dropped), so the
// caller can render them with a distinct marker instead of hiding them.
export function toChartPoints(sets: CountableSet[]): ExerciseChartPoint[] {
  return sets
    .slice()
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map((set) => {
      const estimate = estimateOneRm(set.weight, set.reps)

      return {
        date: set.completedAt,
        weight: set.weight,
        reps: set.reps,
        volume: set.weight * set.reps,
        oneRm: estimate?.value ?? null,
        lowConfidence: estimate?.lowConfidence ?? false,
      }
    })
}
