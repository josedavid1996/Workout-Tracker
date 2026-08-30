import { describe, expect, it } from 'vitest'
import { computeMonthHeatmap, padHeatmapWeeks } from './heatmap'

describe('computeMonthHeatmap', () => {
  it('returns one cell per day in the month, level 0 when no sessions', () => {
    const cells = computeMonthHeatmap([], 2026, 2, '2026-02-10T12:00:00.000Z')
    expect(cells).toHaveLength(28) // Feb 2026 is not a leap year
    expect(cells.every((cell) => cell.level === 0 && cell.sessionsCount === 0)).toBe(true)
  })

  it('assigns level 1/2/3 based on sessions count that day', () => {
    const dates = [
      '2026-07-05T09:00:00.000Z',
      '2026-07-06T09:00:00.000Z',
      '2026-07-06T18:00:00.000Z',
      '2026-07-07T09:00:00.000Z',
      '2026-07-07T13:00:00.000Z',
      '2026-07-07T18:00:00.000Z',
    ]
    const cells = computeMonthHeatmap(dates, 2026, 7, '2026-07-20T00:00:00.000Z')

    expect(cells[4].sessionsCount).toBe(1) // day 5
    expect(cells[4].level).toBe(1)
    expect(cells[5].sessionsCount).toBe(2) // day 6
    expect(cells[5].level).toBe(2)
    expect(cells[6].sessionsCount).toBe(3) // day 7
    expect(cells[6].level).toBe(3)
  })

  it('ignores dates outside the requested month/year', () => {
    const cells = computeMonthHeatmap(['2026-06-30T12:00:00.000Z', '2026-08-01T12:00:00.000Z'], 2026, 7, '2026-07-15T00:00:00.000Z')
    expect(cells.every((cell) => cell.sessionsCount === 0)).toBe(true)
  })

  it('marks the reference day as today and later days as future', () => {
    const cells = computeMonthHeatmap([], 2026, 7, '2026-07-15T12:00:00.000Z')
    expect(cells[14].isToday).toBe(true) // day 15
    expect(cells[13].isToday).toBe(false)
    expect(cells[13].isFuture).toBe(false) // day 14
    expect(cells[15].isFuture).toBe(true) // day 16
  })

  it('marks every day as future when the requested month is entirely ahead of the reference', () => {
    const cells = computeMonthHeatmap([], 2026, 9, '2026-07-15T12:00:00.000Z')
    expect(cells.every((cell) => cell.isFuture)).toBe(true)
  })
})

// PR12 (live audit fix): `history-page.tsx`'s 7-column monthly grid rendered
// `computeMonthHeatmap`'s cells directly, in day order, with no leading
// padding for the 1st's real weekday — so cell N never lined up under the
// same weekday column month to month, and the last row simply stopped
// wherever `daysInMonth % 7` landed, reading as "cut off". `padHeatmapWeeks`
// is a separate pure function (kept apart from `computeMonthHeatmap` so its
// existing index-based tests above stay valid) that adds `null` placeholder
// cells so the grid always aligns to real calendar weeks.
describe('padHeatmapWeeks', () => {
  it('adds leading null padding so day 1 aligns to its real weekday column', () => {
    const cells = computeMonthHeatmap([], 2026, 2, '2026-02-10T12:00:00.000Z')
    const padded = padHeatmapWeeks(cells, 2026, 2)

    // 0 = Sunday, matching `WEEKDAY_LABELS`/`Date#getDay()` convention already
    // used elsewhere in `history-page.tsx` (`startOfWeek`).
    const expectedLeading = new Date(2026, 1, 1).getDay()

    expect(padded.slice(0, expectedLeading).every((cell) => cell === null)).toBe(true)
    expect(padded[expectedLeading]).not.toBeNull()
    expect(padded[expectedLeading]?.day).toBe(1)
  })

  it('pads the end so the grid length is always a whole number of 7-day weeks', () => {
    const cells = computeMonthHeatmap([], 2026, 2, '2026-02-10T12:00:00.000Z')
    const padded = padHeatmapWeeks(cells, 2026, 2)
    expect(padded.length % 7).toBe(0)
  })

  it('keeps every real day cell in order and unmodified between the padding', () => {
    const cells = computeMonthHeatmap([], 2026, 2, '2026-02-10T12:00:00.000Z')
    const padded = padHeatmapWeeks(cells, 2026, 2)
    const realCells = padded.filter((cell): cell is (typeof cells)[number] => cell !== null)
    expect(realCells).toEqual(cells)
  })

  it('never adds more than 6 trailing padding cells', () => {
    const cells = computeMonthHeatmap([], 2026, 3, '2026-03-10T12:00:00.000Z')
    const padded = padHeatmapWeeks(cells, 2026, 3)
    const leadingCount = padded.findIndex((cell) => cell !== null)
    const trailingCount = padded.length - leadingCount - cells.length

    expect(trailingCount).toBeGreaterThanOrEqual(0)
    expect(trailingCount).toBeLessThan(7)
  })
})
