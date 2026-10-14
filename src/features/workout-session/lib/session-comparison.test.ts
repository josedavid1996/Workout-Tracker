import { describe, expect, it } from 'vitest'
import type { CountableSet } from '../../../shared/lib/countable-set'
import { compareWithPreviousSession, formatVolumeDelta } from './session-comparison'

function set(workoutId: string, weight: number, reps: number, completedAt: string): CountableSet {
  return { id: `${workoutId}-${completedAt}`, exerciseId: 'ex-a', weight, reps, completedAt, workoutId }
}

const today = [set('today', 60, 10, '2026-01-15T10:00:00Z'), set('today', 60, 8, '2026-01-15T10:05:00Z')]

describe('compareWithPreviousSession', () => {
  it('compares volume against the most recent earlier session of the exercise', () => {
    const history = [
      set('older', 40, 10, '2026-01-01T10:00:00Z'),
      set('previous', 55, 10, '2026-01-08T10:00:00Z'),
      set('previous', 55, 8, '2026-01-08T10:05:00Z'),
    ]

    expect(compareWithPreviousSession(today, history)).toEqual({ previousVolume: 990, volumeDelta: 90 })
  })

  it('ignores sessions logged after the one being viewed', () => {
    const history = [set('later', 100, 10, '2026-02-01T10:00:00Z'), set('previous', 50, 10, '2026-01-08T10:00:00Z')]

    expect(compareWithPreviousSession(today, history)).toEqual({ previousVolume: 500, volumeDelta: 580 })
  })

  it('returns null the first time an exercise is done, or with nothing logged today', () => {
    expect(compareWithPreviousSession(today, [])).toBeNull()
    expect(compareWithPreviousSession([], [set('previous', 50, 10, '2026-01-08T10:00:00Z')])).toBeNull()
  })
})

describe('formatVolumeDelta', () => {
  it('labels an increase, a decrease and no change', () => {
    expect(formatVolumeDelta(90)).toBe('+90 kg vs. última vez')
    expect(formatVolumeDelta(-40.5)).toBe('−40.5 kg vs. última vez')
    expect(formatVolumeDelta(0)).toBe('Igual que la última vez')
  })
})
