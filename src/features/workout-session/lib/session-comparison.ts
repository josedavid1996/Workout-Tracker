import type { CountableSet } from '../../../shared/lib/countable-set'
import { sessionVolume } from '../../../shared/lib/volume'

// "Today vs. last time" for one exercise on the workout summary.

export type SessionComparison = { previousVolume: number; volumeDelta: number }

function time(set: CountableSet): number {
  return new Date(set.completedAt).getTime()
}

// `currentSets`: this workout's countable sets of the exercise.
// `historicalSets`: its countable sets from every OTHER workout. Only
// sessions earlier than this one count as "last time", so opening an old
// workout from the history compares it with what came before it.
export function compareWithPreviousSession(
  currentSets: CountableSet[],
  historicalSets: CountableSet[],
): SessionComparison | null {
  if (currentSets.length === 0) return null

  const currentStart = Math.min(...currentSets.map(time))
  const earlier = historicalSets.filter((set) => time(set) < currentStart)
  if (earlier.length === 0) return null

  const latest = earlier.reduce((best, set) => (time(set) > time(best) ? set : best))
  const previousVolume = sessionVolume(earlier.filter((set) => set.workoutId === latest.workoutId))

  return { previousVolume, volumeDelta: sessionVolume(currentSets) - previousVolume }
}

export function formatVolumeDelta(delta: number): string {
  if (delta === 0) return 'Igual que la última vez'
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} kg vs. última vez`
}
