// Whole days elapsed between `pastIso` and `referenceIso` (defaults to now),
// floored and clamped to >= 0. Used for "hace Nd" badges (routines list) and
// "última vez hace X días" (home "hoy toca" card) — one shared calculation
// instead of duplicating the day-diff math in both places.
export function daysSince(pastIso: string, referenceIso: string = new Date().toISOString()): number {
  const ms = new Date(referenceIso).getTime() - new Date(pastIso).getTime()
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  return Math.max(0, days)
}
