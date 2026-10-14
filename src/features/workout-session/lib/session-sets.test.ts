import { describe, expect, it } from 'vitest'
import { isWeightMissing, orderSets } from './session-sets'

describe('orderSets', () => {
  it('puts completed sets first in completion order, then pending ones in incoming order', () => {
    const sets = [
      { id: 'p1', completed: false, completed_at: null },
      { id: 'c2', completed: true, completed_at: '2026-01-01T10:05:00Z' },
      { id: 'p2', completed: false, completed_at: null },
      { id: 'c1', completed: true, completed_at: '2026-01-01T10:00:00Z' },
    ]
    expect(orderSets(sets).map((set) => set.id)).toEqual(['c1', 'c2', 'p1', 'p2'])
  })

  it('returns an empty list unchanged', () => {
    expect(orderSets([])).toEqual([])
  })
})

describe('isWeightMissing', () => {
  it('treats a pending 0 kg set as not filled in yet', () => {
    expect(isWeightMissing({ weight: 0, completed: false }, undefined)).toBe(true)
  })

  it('accepts a pending set with a real weight', () => {
    expect(isWeightMissing({ weight: 40, completed: false }, undefined)).toBe(false)
  })

  it('accepts an explicit 0 kg once confirmed', () => {
    expect(isWeightMissing({ weight: 0, completed: false }, 'confirmed')).toBe(false)
  })

  it('flags a field the user cleared, whatever is stored', () => {
    expect(isWeightMissing({ weight: 40, completed: false }, 'missing')).toBe(true)
  })

  it('never flags a completed set', () => {
    expect(isWeightMissing({ weight: 0, completed: true }, undefined)).toBe(false)
    expect(isWeightMissing({ weight: 0, completed: true }, 'missing')).toBe(false)
  })
})
