import { describe, expect, it } from 'vitest'
import { moveDraft } from './move-draft'

describe('moveDraft', () => {
  it('swaps an item with the previous one when moving up', () => {
    expect(moveDraft(['a', 'b', 'c'], 1, 'up')).toEqual(['b', 'a', 'c'])
  })

  it('swaps an item with the next one when moving down', () => {
    expect(moveDraft(['a', 'b', 'c'], 1, 'down')).toEqual(['a', 'c', 'b'])
  })

  it('is a no-op when moving the first item up', () => {
    expect(moveDraft(['a', 'b', 'c'], 0, 'up')).toEqual(['a', 'b', 'c'])
  })

  it('is a no-op when moving the last item down', () => {
    expect(moveDraft(['a', 'b', 'c'], 2, 'down')).toEqual(['a', 'b', 'c'])
  })

  it('is a no-op on a single-item array', () => {
    expect(moveDraft(['a'], 0, 'up')).toEqual(['a'])
    expect(moveDraft(['a'], 0, 'down')).toEqual(['a'])
  })

  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c']
    moveDraft(original, 1, 'up')
    expect(original).toEqual(['a', 'b', 'c'])
  })
})
