// Rough, documented heuristic — no per-exercise timing data exists in the
// schema (no rest-timer/duration columns), so this approximates "~M MIN"
// for a routine that has never actually been run yet (once it HAS been
// run, the real recorded workout duration is used instead — see
// `home-page.tsx`). 8 min/exercise is a rough gym-floor average including
// warmup + rest between sets.
const MINUTES_PER_EXERCISE = 8

export function estimateWorkoutMinutes(exerciseCount: number): number {
  return exerciseCount * MINUTES_PER_EXERCISE
}

// Most frequent non-null value, ties broken by first-seen order (stable,
// deterministic — avoids the filter tab for a routine flip-flopping
// between two equally-common body parts across renders).
export function dominantBodyPart(bodyParts: (string | null)[]): string | null {
  const counts = new Map<string, number>()
  const firstSeenOrder: string[] = []

  for (const bodyPart of bodyParts) {
    if (!bodyPart) continue
    if (!counts.has(bodyPart)) {
      counts.set(bodyPart, 0)
      firstSeenOrder.push(bodyPart)
    }
    counts.set(bodyPart, (counts.get(bodyPart) ?? 0) + 1)
  }

  if (firstSeenOrder.length === 0) return null

  let best = firstSeenOrder[0]
  let bestCount = counts.get(best) ?? 0

  for (const bodyPart of firstSeenOrder) {
    const count = counts.get(bodyPart) ?? 0
    if (count > bestCount) {
      best = bodyPart
      bestCount = count
    }
  }

  return best
}
