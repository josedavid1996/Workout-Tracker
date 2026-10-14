import { describe, expect, it } from 'vitest'
import { FALLBACK_REPS } from './new-set-defaults'
import { buildPrefilledSets, pickPreviousSessionSets } from './prefill-sets'

describe('buildPrefilledSets', () => {
  it('creates one row per target set with the planned reps and last time weights', () => {
    expect(
      buildPrefilledSets({
        targetSets: 3,
        targetReps: '8-10',
        previousSets: [
          { weight: 60, reps: 10 },
          { weight: 62.5, reps: 9 },
          { weight: 62.5, reps: 8 },
        ],
      }),
    ).toEqual([
      { weight: 60, reps: 8 },
      { weight: 62.5, reps: 8 },
      { weight: 62.5, reps: 8 },
    ])
  })

  it('repeats the last previous set when the plan has more sets than last time', () => {
    expect(
      buildPrefilledSets({ targetSets: 3, targetReps: null, previousSets: [{ weight: 40, reps: 12 }] }),
    ).toEqual([
      { weight: 40, reps: 12 },
      { weight: 40, reps: 12 },
      { weight: 40, reps: 12 },
    ])
  })

  it('leaves the weight empty when there is no history', () => {
    expect(buildPrefilledSets({ targetSets: 2, targetReps: '12', previousSets: [] })).toEqual([
      { weight: null, reps: 12 },
      { weight: null, reps: 12 },
    ])
  })

  it('falls back to a default rep count with neither a plan nor history', () => {
    expect(buildPrefilledSets({ targetSets: 1, targetReps: 'AMRAP', previousSets: [] })).toEqual([
      { weight: null, reps: FALLBACK_REPS },
    ])
  })

  it('uses last time set count when the routine has no target sets', () => {
    expect(
      buildPrefilledSets({
        targetSets: null,
        targetReps: null,
        previousSets: [
          { weight: 20, reps: 15 },
          { weight: 20, reps: 12 },
        ],
      }),
    ).toEqual([
      { weight: 20, reps: 15 },
      { weight: 20, reps: 12 },
    ])
  })

  it('creates no rows with neither target sets nor history, or a zero target', () => {
    expect(buildPrefilledSets({ targetSets: null, targetReps: '10', previousSets: [] })).toEqual([])
    expect(buildPrefilledSets({ targetSets: 0, targetReps: '10', previousSets: [{ weight: 5, reps: 5 }] })).toEqual([])
  })

  it('keeps an explicit 0 kg (bodyweight) from last time', () => {
    expect(buildPrefilledSets({ targetSets: 1, targetReps: '10', previousSets: [{ weight: 0, reps: 10 }] })).toEqual([
      { weight: 0, reps: 10 },
    ])
  })
})

describe('pickPreviousSessionSets', () => {
  const rows = [
    { workout_id: 'old', weight: 50, reps: 8, completed_at: '2026-01-01T10:00:00Z' },
    { workout_id: 'recent', weight: 62.5, reps: 7, completed_at: '2026-01-08T10:05:00Z' },
    { workout_id: 'recent', weight: 60, reps: 8, completed_at: '2026-01-08T10:00:00Z' },
    { workout_id: 'current', weight: 65, reps: 5, completed_at: '2026-01-15T10:00:00Z' },
  ]

  it('returns the most recent other workout sets, oldest first', () => {
    expect(pickPreviousSessionSets(rows, 'current')).toEqual([
      { weight: 60, reps: 8 },
      { weight: 62.5, reps: 7 },
    ])
  })

  it('returns an empty list when only the excluded workout has sets, or there are none', () => {
    expect(pickPreviousSessionSets([rows[3]], 'current')).toEqual([])
    expect(pickPreviousSessionSets([], 'current')).toEqual([])
  })
})
