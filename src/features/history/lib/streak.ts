// Real streak calculation (not a placeholder): counts consecutive calendar
// days, ending at "today" or "yesterday", that have at least one finished
// workout. If the most recent workout is more than 1 day before the
// reference date, the streak is considered broken and returns 0 — this
// matches the "Racha ACTIVA" framing in the Figma banner (01-home.md),
// which implies a currently-live streak, not a historical best.
function toDayKey(iso: string): string {
  return iso.slice(0, 10) // 'YYYY-MM-DD', consistent with the ISO strings already used elsewhere (e.g. format-duration.ts)
}

function dayKeyToUtcMs(dayKey: string): number {
  const [year, month, day] = dayKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function computeStreakDays(
  workoutDates: string[],
  referenceIso: string = new Date().toISOString(),
): number {
  const dayKeys = Array.from(new Set(workoutDates.map(toDayKey))).sort().reverse()
  if (dayKeys.length === 0) return 0

  const referenceDayMs = dayKeyToUtcMs(toDayKey(referenceIso))
  const mostRecentDayMs = dayKeyToUtcMs(dayKeys[0])
  const gapFromReference = Math.round((referenceDayMs - mostRecentDayMs) / ONE_DAY_MS)

  if (gapFromReference > 1) return 0

  let streak = 1
  let previousDayMs = mostRecentDayMs

  for (let i = 1; i < dayKeys.length; i += 1) {
    const currentDayMs = dayKeyToUtcMs(dayKeys[i])
    const gap = Math.round((previousDayMs - currentDayMs) / ONE_DAY_MS)

    if (gap === 1) {
      streak += 1
      previousDayMs = currentDayMs
    } else {
      break
    }
  }

  return streak
}

const ONE_WEEK_MS = 7 * ONE_DAY_MS

// Monday (UTC) of the week a day belongs to, as a UTC timestamp.
function weekStartMs(dayKey: string): number {
  const dayMs = dayKeyToUtcMs(dayKey)
  const daysSinceMonday = (new Date(dayMs).getUTCDay() + 6) % 7
  return dayMs - daysSinceMonday * ONE_DAY_MS
}

// Streak in WEEKS: consecutive calendar weeks (Monday to Sunday) with at
// least one finished workout. Rest days never break it, and neither does a
// current week with no workout yet — the streak is only lost once a whole
// week goes by empty. This is what the home screen shows; `computeStreakDays`
// above broke on every rest day.
export function computeStreakWeeks(
  workoutDates: string[],
  referenceIso: string = new Date().toISOString(),
): number {
  const trainedWeeks = new Set(workoutDates.map((iso) => weekStartMs(toDayKey(iso))))
  if (trainedWeeks.size === 0) return 0

  let week = weekStartMs(toDayKey(referenceIso))
  if (!trainedWeeks.has(week)) week -= ONE_WEEK_MS

  let streak = 0
  while (trainedWeeks.has(week)) {
    streak += 1
    week -= ONE_WEEK_MS
  }

  return streak
}
