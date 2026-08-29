import type { CountableSet } from './countable-set'

// Assumes `sets` was already filtered with `isCountable` — this function
// never re-applies that filter itself, to avoid duplicating the exclusion
// rule in two places.
export function sessionVolume(sets: CountableSet[]): number {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0)
}
