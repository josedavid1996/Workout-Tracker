import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('joins truthy class names with a space', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out false, null, undefined and empty string', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('returns an empty string when nothing is truthy', () => {
    expect(cx(false, null, undefined)).toBe('')
  })

  it('supports conditional expressions inline', () => {
    const isActive = true
    expect(cx('base', isActive && 'active')).toBe('base active')
  })
})
