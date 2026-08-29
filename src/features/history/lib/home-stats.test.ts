import { describe, expect, it } from 'vitest'
import { computeHomeStats } from './home-stats'

const set = (overrides: Partial<Parameters<typeof computeHomeStats>[0][number]['sets'][number]> = {}) => ({
  id: 's-1',
  exerciseId: 'ex-a',
  weight: 100,
  reps: 5,
  completedAt: '2026-01-01T00:00:00Z',
  workoutId: 'w-1',
  ...overrides,
})

describe('computeHomeStats', () => {
  it('returns all zeros with no workouts', () => {
    expect(computeHomeStats([])).toEqual({ sessions: 0, volumeKg: 0, prCount: 0 })
  })

  it('counts sessions and sums volume across all workouts', () => {
    const result = computeHomeStats([
      { id: 'w-1', sets: [set({ workoutId: 'w-1', weight: 100, reps: 5 })] },
      { id: 'w-2', sets: [set({ workoutId: 'w-2', weight: 50, reps: 10 })] },
    ])

    expect(result.sessions).toBe(2)
    expect(result.volumeKg).toBe(100 * 5 + 50 * 10)
  })

  it('counts a PR when the most recent workout holds an exercise\'s all-time best set', () => {
    // Most recent workout (w-2, first in the array — caller passes newest-first)
    // has a heavier/better set for ex-a than the older workout w-1.
    const result = computeHomeStats([
      { id: 'w-2', sets: [set({ id: 's-2', workoutId: 'w-2', exerciseId: 'ex-a', weight: 120, reps: 5 })] },
      { id: 'w-1', sets: [set({ id: 's-1', workoutId: 'w-1', exerciseId: 'ex-a', weight: 100, reps: 5 })] },
    ])

    expect(result.prCount).toBe(1)
  })

  it('does not count a PR when the best set for an exercise belongs to an older workout', () => {
    const result = computeHomeStats([
      { id: 'w-2', sets: [set({ id: 's-2', workoutId: 'w-2', exerciseId: 'ex-a', weight: 80, reps: 5 })] },
      { id: 'w-1', sets: [set({ id: 's-1', workoutId: 'w-1', exerciseId: 'ex-a', weight: 100, reps: 5 })] },
    ])

    expect(result.prCount).toBe(0)
  })

  it('counts PRs independently per exercise', () => {
    const result = computeHomeStats([
      {
        id: 'w-2',
        sets: [
          set({ id: 's-2a', workoutId: 'w-2', exerciseId: 'ex-a', weight: 120, reps: 5 }),
          set({ id: 's-2b', workoutId: 'w-2', exerciseId: 'ex-b', weight: 40, reps: 8 }),
        ],
      },
      {
        id: 'w-1',
        sets: [
          set({ id: 's-1a', workoutId: 'w-1', exerciseId: 'ex-a', weight: 100, reps: 5 }),
          set({ id: 's-1b', workoutId: 'w-1', exerciseId: 'ex-b', weight: 60, reps: 8 }),
        ],
      },
    ])

    // ex-a improved in the most recent workout (PR), ex-b did not.
    expect(result.prCount).toBe(1)
  })
})
