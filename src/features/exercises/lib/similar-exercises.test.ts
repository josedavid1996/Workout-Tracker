import { describe, expect, it } from 'vitest'
import type { FocusCandidate } from './similar-exercises'
import { pickSimilarExercises } from './similar-exercises'

type Item = { id: string; equipment?: string | null }

function focusCandidate(
  id: string,
  overrides: Partial<Omit<FocusCandidate<Item>, 'exercise'>> = {},
): FocusCandidate<Item> {
  return { exercise: { id }, focus: 'lateral_deltoid', confidence: 'high', is_stretch: false, ...overrides }
}

describe('pickSimilarExercises', () => {
  it('returns same-focus candidates first, then fills from same-target', () => {
    const result = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: false },
      focusCandidates: [focusCandidate('f1')],
      targetCandidates: [{ id: 't1' }, { id: 't2' }],
    })

    expect(result).toEqual([
      { exercise: { id: 'f1' }, focus: 'lateral_deltoid' },
      { exercise: { id: 't1' }, focus: null },
      { exercise: { id: 't2' }, focus: null },
    ])
  })

  it('caps the result at 3 by default', () => {
    const result = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: false },
      focusCandidates: [focusCandidate('f1'), focusCandidate('f2'), focusCandidate('f3'), focusCandidate('f4')],
      targetCandidates: [{ id: 't1' }],
    })

    expect(result.map((item) => item.exercise.id)).toEqual(['f1', 'f2', 'f3'])
  })

  it('honours a custom limit', () => {
    const result = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: false },
      focusCandidates: [focusCandidate('f1')],
      targetCandidates: [{ id: 't1' }, { id: 't2' }],
      limit: 2,
    })

    expect(result.map((item) => item.exercise.id)).toEqual(['f1', 't1'])
  })

  it('skips low-confidence same-focus candidates', () => {
    const result = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: false },
      focusCandidates: [focusCandidate('low', { confidence: 'low' }), focusCandidate('med', { confidence: 'medium' })],
      targetCandidates: [],
    })

    expect(result.map((item) => item.exercise.id)).toEqual(['med'])
  })

  it('only keeps same-focus candidates whose is_stretch matches the current exercise', () => {
    const stretching = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: true },
      focusCandidates: [focusCandidate('strength'), focusCandidate('stretch', { is_stretch: true })],
      targetCandidates: [],
    })
    const strength = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: false },
      focusCandidates: [focusCandidate('strength'), focusCandidate('stretch', { is_stretch: true })],
      targetCandidates: [],
    })

    expect(stretching.map((item) => item.exercise.id)).toEqual(['stretch'])
    expect(strength.map((item) => item.exercise.id)).toEqual(['strength'])
  })

  it('ignores focus candidates entirely when the current exercise has no focus', () => {
    const result = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: null,
      focusCandidates: [focusCandidate('f1')],
      targetCandidates: [{ id: 't1' }],
    })

    expect(result).toEqual([{ exercise: { id: 't1' }, focus: null }])
  })

  it('excludes the current exercise and dedupes across both lists, keeping the focus entry', () => {
    const result = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: false },
      focusCandidates: [focusCandidate('cur'), focusCandidate('shared'), focusCandidate('shared')],
      targetCandidates: [{ id: 'cur' }, { id: 'shared' }, { id: 't1' }],
    })

    expect(result).toEqual([
      { exercise: { id: 'shared' }, focus: 'lateral_deltoid' },
      { exercise: { id: 't1' }, focus: null },
    ])
  })

  it('keeps input order within each source', () => {
    const result = pickSimilarExercises<Item>({
      currentId: 'cur',
      currentFocus: { is_stretch: false },
      focusCandidates: [focusCandidate('z'), focusCandidate('a')],
      targetCandidates: [{ id: 'y' }, { id: 'b' }],
      limit: 4,
    })

    expect(result.map((item) => item.exercise.id)).toEqual(['z', 'a', 'y', 'b'])
  })

  it('returns an empty list when there are no candidates or the limit is 0', () => {
    expect(
      pickSimilarExercises<Item>({ currentId: 'cur', currentFocus: null, focusCandidates: [], targetCandidates: [] }),
    ).toEqual([])
    expect(
      pickSimilarExercises<Item>({
        currentId: 'cur',
        currentFocus: null,
        focusCandidates: [],
        targetCandidates: [{ id: 't1' }],
        limit: 0,
      }),
    ).toEqual([])
  })

  describe('equipment diversity', () => {
    it('round-robins same-focus candidates by equipment instead of taking the first (alphabetical) ones', () => {
      const result = pickSimilarExercises<Item>({
        currentId: 'cur',
        currentFocus: { is_stretch: false },
        focusCandidates: [
          { ...focusCandidate('bb1'), exercise: { id: 'bb1', equipment: 'barbell' } },
          { ...focusCandidate('bb2'), exercise: { id: 'bb2', equipment: 'barbell' } },
          { ...focusCandidate('bb3'), exercise: { id: 'bb3', equipment: 'barbell' } },
          { ...focusCandidate('db1'), exercise: { id: 'db1', equipment: 'dumbbell' } },
          { ...focusCandidate('cb1'), exercise: { id: 'cb1', equipment: 'cable' } },
        ],
        targetCandidates: [],
      })

      expect(result.map((item) => item.exercise.id)).toEqual(['bb1', 'db1', 'cb1'])
    })

    it('stays stable within an equipment group and still fills up to the limit', () => {
      const result = pickSimilarExercises<Item>({
        currentId: 'cur',
        currentFocus: null,
        focusCandidates: [],
        targetCandidates: [
          { id: 'bb1', equipment: 'barbell' },
          { id: 'bb2', equipment: 'barbell' },
          { id: 'bb3', equipment: 'barbell' },
          { id: 'db1', equipment: 'dumbbell' },
        ],
        limit: 4,
      })

      expect(result.map((item) => item.exercise.id)).toEqual(['bb1', 'db1', 'bb2', 'bb3'])
    })

    it('prefers same-target candidates whose equipment was not already picked in the focus tier', () => {
      const result = pickSimilarExercises<Item>({
        currentId: 'cur',
        currentFocus: { is_stretch: false },
        focusCandidates: [{ ...focusCandidate('f-bb'), exercise: { id: 'f-bb', equipment: 'barbell' } }],
        targetCandidates: [
          { id: 't-bb', equipment: 'barbell' },
          { id: 't-cb', equipment: 'cable' },
        ],
        limit: 2,
      })

      expect(result.map((item) => item.exercise.id)).toEqual(['f-bb', 't-cb'])
    })

    it('keeps the same-focus tier ahead of the same-target tier even when it repeats equipment', () => {
      const result = pickSimilarExercises<Item>({
        currentId: 'cur',
        currentFocus: { is_stretch: false },
        focusCandidates: [
          { ...focusCandidate('f1'), exercise: { id: 'f1', equipment: 'barbell' } },
          { ...focusCandidate('f2'), exercise: { id: 'f2', equipment: 'barbell' } },
        ],
        targetCandidates: [{ id: 't-db', equipment: 'dumbbell' }],
      })

      expect(result.map((item) => item.exercise.id)).toEqual(['f1', 'f2', 't-db'])
    })
  })
})
