export type HeatmapDay = {
  day: number
  dateIso: string
  sessionsCount: number
  level: 0 | 1 | 2 | 3
  isToday: boolean
  isFuture: boolean
}

// Groups a list of finished-workout timestamps into a GitHub-style per-day
// activity grid for one calendar month (`month` is 1-12, matching
// `Date#getMonth() + 1`). `level` is derived from how many sessions
// happened that day (0 -> 0, 1 -> 1, 2 -> 2, 3+ -> 3) — the simplest
// available signal, since the schema has no per-day "load"/volume rollup to
// weight by instead, and in practice most days have at most one session
// (see `design/figma-reference/08-historial-general.md`).
export function computeMonthHeatmap(
  workoutDates: string[],
  year: number,
  month: number,
  referenceIso: string = new Date().toISOString(),
): HeatmapDay[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const reference = new Date(referenceIso)
  const referenceDayStart = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()).getTime()

  const countsByDay = new Map<number, number>()
  for (const iso of workoutDates) {
    const date = new Date(iso)
    if (date.getFullYear() === year && date.getMonth() + 1 === month) {
      const day = date.getDate()
      countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
    }
  }

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const sessionsCount = countsByDay.get(day) ?? 0
    const level: 0 | 1 | 2 | 3 = sessionsCount === 0 ? 0 : sessionsCount === 1 ? 1 : sessionsCount === 2 ? 2 : 3
    const dayDate = new Date(year, month - 1, day)
    const dayStart = dayDate.getTime()

    return {
      day,
      dateIso: dayDate.toISOString(),
      sessionsCount,
      level,
      isToday: dayStart === referenceDayStart,
      isFuture: dayStart > referenceDayStart,
    }
  })
}
