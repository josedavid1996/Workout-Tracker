import { describe, expect, it } from 'vitest'
import type { CountableSet } from './countable-set'
import { bestByRepCount, bestOverall, projectedBest } from './records'

function makeSet(overrides: Partial<CountableSet> & { id: string }): CountableSet {
  return {
    exerciseId: 'e1',
    weight: 0,
    reps: 0,
    completedAt: '2026-01-01T00:00:00Z',
    workoutId: 'w1',
    ...overrides,
  }
}

describe('bestOverall', () => {
  it('returns null for an empty array', () => {
    expect(bestOverall([])).toBeNull()
  })

  it('picks the set with the highest estimated 1RM, not the highest raw weight*reps', () => {
    // 100x10 -> 1RM ~= 133.33; 120x5 -> 1RM = 135. The second has the higher 1RM
    // even though it has less raw volume (600 vs 1000), so it must win.
    const higherVolume = makeSet({ id: 'higher-volume', weight: 100, reps: 10 })
    const higherOneRm = makeSet({ id: 'higher-one-rm', weight: 120, reps: 5 })
    expect(bestOverall([higherVolume, higherOneRm])?.id).toBe('higher-one-rm')
  })
})

describe('bestByRepCount', () => {
  it('returns an empty map for an empty array', () => {
    expect(bestByRepCount([]).size).toBe(0)
  })

  it('keeps the heaviest weight for each exact rep count', () => {
    const lighterEight = makeSet({ id: 'lighter-eight', weight: 80, reps: 8 })
    const heavierEight = makeSet({ id: 'heavier-eight', weight: 90, reps: 8 })
    const ten = makeSet({ id: 'ten', weight: 60, reps: 10 })
    const map = bestByRepCount([lighterEight, heavierEight, ten])
    expect(map.get(8)?.id).toBe('heavier-eight')
    expect(map.get(10)?.id).toBe('ten')
    expect(map.size).toBe(2)
  })
})

describe('projectedBest', () => {
  it('returns null for an empty array', () => {
    expect(projectedBest([], 5)).toBeNull()
  })

  it('projects the weight for the target reps from the best historical 1RM', () => {
    const set = makeSet({ id: 'a', weight: 120, reps: 5 }) // 1RM = 135
    const result = projectedBest([set], 15)
    // weight = 135 * (37 - 15) / 36 = 82.5
    expect(result?.value).toBeCloseTo(82.5, 5)
    expect(result?.lowConfidence).toBe(true)
  })

  it('does not mark lowConfidence at or below 12 target reps', () => {
    const set = makeSet({ id: 'a', weight: 120, reps: 5 })
    const result = projectedBest([set], 10)
    expect(result?.lowConfidence).toBe(false)
  })
})
