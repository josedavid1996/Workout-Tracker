import { describe, expect, it } from 'vitest'
import type { CountableSet } from '../../../shared/lib/countable-set'
import { computeEightWeekDelta } from './eight-week-delta'

const REFERENCE = '2026-08-29T00:00:00.000Z'

function set(weight: number, reps: number, completedAt: string): CountableSet {
  return { id: `${weight}-${reps}-${completedAt}`, exerciseId: 'e1', weight, reps, completedAt, workoutId: 'w1' }
}

describe('computeEightWeekDelta', () => {
  it('returns null when there are no sets at all', () => {
    expect(computeEightWeekDelta([], REFERENCE)).toBeNull()
  })

  it('returns null when every set is more recent than 8 weeks ago (no old baseline)', () => {
    const sets = [set(100, 5, '2026-08-20T00:00:00.000Z')]
    expect(computeEightWeekDelta(sets, REFERENCE)).toBeNull()
  })

  it('computes a positive delta when the current best 1RM improved vs 8+ weeks ago', () => {
    const sets = [
      set(80, 5, '2026-06-01T00:00:00.000Z'), // old baseline, well past 8 weeks
      set(100, 5, '2026-08-25T00:00:00.000Z'), // recent, better
    ]
    const delta = computeEightWeekDelta(sets, REFERENCE)
    expect(delta).not.toBeNull()
    expect(delta!.deltaKg).toBeGreaterThan(0)
  })

  it('computes a negative delta when current best 1RM regressed vs 8+ weeks ago', () => {
    const sets = [
      set(100, 5, '2026-06-01T00:00:00.000Z'),
      set(80, 5, '2026-08-25T00:00:00.000Z'),
    ]
    const delta = computeEightWeekDelta(sets, REFERENCE)
    expect(delta!.deltaKg).toBeLessThan(0)
  })

  it('marks lowConfidence when either the old or current best set has reps > 12', () => {
    const sets = [
      set(50, 15, '2026-06-01T00:00:00.000Z'),
      set(100, 5, '2026-08-25T00:00:00.000Z'),
    ]
    const delta = computeEightWeekDelta(sets, REFERENCE)
    expect(delta!.lowConfidence).toBe(true)
  })
})
