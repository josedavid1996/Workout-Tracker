import { describe, expect, it } from 'vitest'
import { reorderByRememberedIds } from './reorder-by-remembered-ids'

describe('reorderByRememberedIds', () => {
  it('returns the items as-is when there is no remembered order yet', () => {
    const items = [{ id: 'b' }, { id: 'a' }]
    expect(reorderByRememberedIds(items, undefined)).toEqual(items)
  })

  it('re-applies a remembered order over a differently-ordered fetch', () => {
    const items = [{ id: 'c' }, { id: 'a' }, { id: 'b' }]
    expect(reorderByRememberedIds(items, ['a', 'b', 'c'])).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
  })

  it('appends a genuinely new id at the end, in its incoming order', () => {
    const items = [{ id: 'b' }, { id: 'a' }, { id: 'c' }]
    expect(reorderByRememberedIds(items, ['a', 'b'])).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
  })

  it('drops a remembered id that no longer exists in the fetch', () => {
    const items = [{ id: 'a' }, { id: 'c' }]
    expect(reorderByRememberedIds(items, ['a', 'b', 'c'])).toEqual([{ id: 'a' }, { id: 'c' }])
  })

  it('does not mutate the input array', () => {
    const items = [{ id: 'b' }, { id: 'a' }]
    reorderByRememberedIds(items, ['a', 'b'])
    expect(items).toEqual([{ id: 'b' }, { id: 'a' }])
  })
})
