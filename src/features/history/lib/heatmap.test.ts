import { describe, expect, it } from 'vitest'
import { computeMonthHeatmap } from './heatmap'

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
