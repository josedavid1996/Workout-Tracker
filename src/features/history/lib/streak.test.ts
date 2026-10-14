import { describe, expect, it } from 'vitest'
import { computeStreakDays, computeStreakWeeks } from './streak'

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

describe('computeStreakWeeks', () => {
  // 2026-10-14 is a Wednesday; its week runs Mon 2026-10-12 .. Sun 2026-10-18.
  const reference = '2026-10-14T12:00:00.000Z'

  it('returns 0 with no workout dates', () => {
    expect(computeStreakWeeks([], reference)).toBe(0)
  })

  it('counts consecutive calendar weeks with at least one workout, rest days included', () => {
    expect(
      computeStreakWeeks(
        ['2026-10-13T10:00:00.000Z', '2026-10-05T10:00:00.000Z', '2026-10-01T10:00:00.000Z', '2026-09-28T10:00:00.000Z'],
        reference,
      ),
    ).toBe(3)
  })

  it('is not broken by a current week with no workout yet', () => {
    expect(computeStreakWeeks(['2026-10-11T10:00:00.000Z', '2026-10-04T10:00:00.000Z'], reference)).toBe(2)
  })

  it('returns 0 when neither this week nor last week has a workout', () => {
    expect(computeStreakWeeks(['2026-09-30T10:00:00.000Z'], reference)).toBe(0)
  })

  it('stops at the first empty week', () => {
    expect(computeStreakWeeks(['2026-10-12T10:00:00.000Z', '2026-09-21T10:00:00.000Z'], reference)).toBe(1)
  })

  it('counts several workouts in the same week once', () => {
    expect(computeStreakWeeks(['2026-10-12T10:00:00.000Z', '2026-10-13T10:00:00.000Z'], reference)).toBe(1)
  })
})
