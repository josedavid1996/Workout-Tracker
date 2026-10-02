// Relative "last time" wording for the home "Hoy toca" card. `days` comes
// from `daysSince` (whole days, >= 0); `null` means the routine was never
// trained.
export function lastUsedLabel(days: number | null): string {
  if (days === null) return 'Todavía no entrenaste esta rutina'
  if (days === 0) return 'Última vez hoy'
  if (days === 1) return 'Última vez ayer'
  return `Última vez hace ${days} días`
}
