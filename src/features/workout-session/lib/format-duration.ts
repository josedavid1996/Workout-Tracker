// Static duration formatting — `finished_at - created_at`, computed once.
// No live counter anywhere: this is intentionally not a ticking timer.
export function formatDuration(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  const totalMinutes = Math.max(0, Math.round(ms / 60_000))

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} min`
  return `${hours}h ${minutes}min`
}
