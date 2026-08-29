import { describe, expect, it } from 'vitest'
import { computeStreakDays } from './streak'

const REF = '2026-01-10T12:00:00Z' // Saturday, reference "today"

describe('computeStreakDays', () => {
  it('returns 0 with no workout dates', () => {
    expect(computeStreakDays([], REF)).toBe(0)
  })

  it('returns 1 when the only workout was today', () => {
    expect(computeStreakDays(['2026-01-10T08:00:00Z'], REF)).toBe(1)
  })

  it('returns 1 when the only workout was yesterday (streak still active)', () => {
    expect(computeStreakDays(['2026-01-09T08:00:00Z'], REF)).toBe(1)
  })

  it('returns 0 when the most recent workout was more than 1 day ago (streak broken)', () => {
    expect(computeStreakDays(['2026-01-07T08:00:00Z'], REF)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(
      computeStreakDays(
        ['2026-01-10T08:00:00Z', '2026-01-09T08:00:00Z', '2026-01-08T08:00:00Z'],
        REF,
      ),
    ).toBe(3)
  })

  it('counts consecutive days ending yesterday', () => {
    expect(
      computeStreakDays(['2026-01-09T08:00:00Z', '2026-01-08T08:00:00Z', '2026-01-07T08:00:00Z'], REF),
    ).toBe(3)
  })

  it('dedupes multiple workouts on the same day', () => {
    expect(computeStreakDays(['2026-01-10T08:00:00Z', '2026-01-10T20:00:00Z'], REF)).toBe(1)
  })

  it('stops counting at the first gap, ignoring older non-consecutive days', () => {
    expect(
      computeStreakDays(
        ['2026-01-10T08:00:00Z', '2026-01-09T08:00:00Z', '2026-01-05T08:00:00Z'],
        REF,
      ),
    ).toBe(2)
  })
})
