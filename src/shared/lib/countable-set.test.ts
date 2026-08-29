import { describe, expect, it } from 'vitest'
import { isCountable } from './countable-set'

describe('isCountable', () => {
  it('excludes a completed warmup set', () => {
    expect(isCountable({ completed: true, tag: 'warmup' })).toBe(false)
  })

  it('includes a completed normal set', () => {
    expect(isCountable({ completed: true, tag: 'normal' })).toBe(true)
  })

  it('includes a completed drop set', () => {
    expect(isCountable({ completed: true, tag: 'drop' })).toBe(true)
  })

  it('includes a completed failure set', () => {
    expect(isCountable({ completed: true, tag: 'failure' })).toBe(true)
  })

  it('excludes any tag when the set is not completed', () => {
    expect(isCountable({ completed: false, tag: 'normal' })).toBe(false)
    expect(isCountable({ completed: false, tag: 'drop' })).toBe(false)
    expect(isCountable({ completed: false, tag: 'failure' })).toBe(false)
    expect(isCountable({ completed: false, tag: 'warmup' })).toBe(false)
  })
})
