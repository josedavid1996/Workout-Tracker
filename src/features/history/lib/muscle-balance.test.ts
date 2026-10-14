import { describe, expect, it } from 'vitest'
import { countSetsByMuscle } from './muscle-balance'

describe('countSetsByMuscle', () => {
  it('counts sets per main muscle, most trained first', () => {
    const rows = [
      { focus: 'upper_chest', target: 'pectorals' },
      { focus: 'upper_chest', target: 'pectorals' },
      { focus: 'lats', target: 'lats' },
      { focus: 'upper_chest', target: 'pectorals' },
    ]

    expect(countSetsByMuscle(rows, (focus) => `label:${focus}`)).toEqual([
      { muscle: 'label:upper_chest', sets: 3 },
      { muscle: 'label:lats', sets: 1 },
    ])
  })

  it('falls back to the catalog target when an exercise has no focus tag', () => {
    const rows = [
      { focus: null, target: 'calves' },
      { focus: null, target: 'calves' },
    ]

    expect(countSetsByMuscle(rows, (focus, target) => focus ?? `target:${target}`)).toEqual([
      { muscle: 'target:calves', sets: 2 },
    ])
  })

  it('merges rows that resolve to the same label and skips unlabeled ones', () => {
    const rows = [
      { focus: 'lats', target: 'lats' },
      { focus: null, target: 'lats' },
      { focus: null, target: null },
    ]

    expect(countSetsByMuscle(rows, (focus, target) => focus ?? target ?? '')).toEqual([{ muscle: 'lats', sets: 2 }])
  })

  it('breaks ties alphabetically and returns an empty list for no rows', () => {
    const rows = [
      { focus: 'b', target: null },
      { focus: 'a', target: null },
    ]

    expect(countSetsByMuscle(rows, (focus) => focus ?? '').map((entry) => entry.muscle)).toEqual(['a', 'b'])
    expect(countSetsByMuscle([], () => 'x')).toEqual([])
  })
})
