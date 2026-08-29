import { describe, expect, it } from 'vitest'
import type { CountableSet } from '../../../shared/lib/countable-set'
import { toChartPoints } from './to-chart-points'

function set(overrides: Partial<CountableSet>): CountableSet {
  return {
    id: 's1',
    exerciseId: 'ex-a',
    weight: 100,
    reps: 5,
    completedAt: '2026-01-01T00:00:00Z',
    workoutId: 'w1',
    ...overrides,
  }
}

describe('toChartPoints', () => {
  it('returns an empty array for no sets', () => {
    expect(toChartPoints([])).toEqual([])
  })

  it('sorts ascending by completedAt (oldest first) regardless of input order', () => {
    const newer = set({ id: 's-new', completedAt: '2026-02-01T00:00:00Z' })
    const older = set({ id: 's-old', completedAt: '2026-01-01T00:00:00Z' })

    const result = toChartPoints([newer, older])

    expect(result.map((point) => point.date)).toEqual(['2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'])
  })

  it('computes volume as weight * reps and the Brzycki 1RM estimate', () => {
    const [point] = toChartPoints([set({ weight: 100, reps: 5 })])

    expect(point.volume).toBe(500)
    expect(point.oneRm).toBeCloseTo(112.5, 5)
    expect(point.lowConfidence).toBe(false)
  })

  it('marks lowConfidence once reps exceed 12, without hiding the point', () => {
    const [point] = toChartPoints([set({ weight: 40, reps: 15 })])

    expect(point.lowConfidence).toBe(true)
    expect(point.oneRm).not.toBeNull()
  })

  it('sets oneRm to null when the Brzycki estimate is undefined (reps >= 37)', () => {
    const [point] = toChartPoints([set({ weight: 40, reps: 37 })])

    expect(point.oneRm).toBeNull()
    expect(point.lowConfidence).toBe(false)
  })
})
