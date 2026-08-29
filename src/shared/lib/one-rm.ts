// Brzycki formula for estimated one-rep max: 1RM = weight * 36 / (37 - reps).
// Deliberately NOT Epley — Brzycki is the project's chosen estimator.
export type OneRmEstimate = {
  value: number
  lowConfidence: boolean
}

// The formula is undefined (division by zero, or negative for reps > 37) at
// reps >= 37, so we return null rather than a misleading number.
export function estimateOneRm(weight: number, reps: number): OneRmEstimate | null {
  if (reps >= 37) return null

  return {
    value: (weight * 36) / (37 - reps),
    lowConfidence: reps > 12,
  }
}
