import { describe, expect, it } from 'vitest'
import type { CountableSet } from './countable-set'
import { sessionVolume } from './volume'

function makeSet(overrides: Partial<CountableSet> = {}): CountableSet {
  return {
    id: 's1',
    exerciseId: 'e1',
    weight: 0,
    reps: 0,
    completedAt: '2026-01-01T00:00:00Z',
    workoutId: 'w1',
    ...overrides,
  }
}

describe('sessionVolume', () => {
  it('sums weight * reps across already-filtered sets', () => {
    const sets = [makeSet({ weight: 100, reps: 5 }), makeSet({ weight: 80, reps: 8 })]
    expect(sessionVolume(sets)).toBe(100 * 5 + 80 * 8)
  })

  it('returns 0 for an empty array', () => {
    expect(sessionVolume([])).toBe(0)
  })

  it('returns weight * reps for a single set', () => {
    expect(sessionVolume([makeSet({ weight: 60, reps: 10 })])).toBe(600)
  })
})
