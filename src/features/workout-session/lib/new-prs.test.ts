import { describe, expect, it } from 'vitest'
import type { CountableSet } from '../../../shared/lib/countable-set'
import { detectNewPrs } from './new-prs'

function set(weight: number, reps: number): CountableSet {
  return { id: `${weight}-${reps}`, exerciseId: 'e1', weight, reps, completedAt: '2026-08-29T00:00:00.000Z', workoutId: 'w1' }
}

describe('detectNewPrs', () => {
  it('returns empty when the current session has no sets for any exercise', () => {
    expect(detectNewPrs(new Map(), new Map())).toEqual([])
  })

  it('counts a PR when the exercise has no historical sets at all (first time logged)', () => {
    const current = new Map([['e1', [set(100, 5)]]])
    const result = detectNewPrs(current, new Map())
    expect(result).toHaveLength(1)
    expect(result[0].exerciseId).toBe('e1')
  })

  it('counts a PR when the current best 1RM beats the historical best', () => {
    const current = new Map([['e1', [set(110, 5)]]])
    const historical = new Map([['e1', [set(100, 5)]]])
    const result = detectNewPrs(current, historical)
    expect(result).toHaveLength(1)
  })

  it('does not count a PR when the current best 1RM is equal to or lower than the historical best', () => {
    const current = new Map([['e1', [set(90, 5)]]])
    const historical = new Map([['e1', [set(100, 5)]]])
    expect(detectNewPrs(current, historical)).toEqual([])
  })

  it('evaluates each exercise independently', () => {
    const current = new Map([
      ['e1', [set(110, 5)]], // PR
      ['e2', [set(50, 5)]], // not a PR
    ])
    const historical = new Map([
      ['e1', [set(100, 5)]],
      ['e2', [set(60, 5)]],
    ])
    const result = detectNewPrs(current, historical)
    expect(result.map((pr) => pr.exerciseId)).toEqual(['e1'])
  })
})
