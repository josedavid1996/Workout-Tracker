import { describe, expect, it } from 'vitest'
import { escapeLikePattern } from './escape-like'

describe('escapeLikePattern', () => {
  it('leaves plain text untouched', () => {
    expect(escapeLikePattern('bench press')).toBe('bench press')
  })

  it('escapes the LIKE wildcards % and _', () => {
    expect(escapeLikePattern('100%_run')).toBe('100\\%\\_run')
  })

  it('escapes the escape character itself first', () => {
    expect(escapeLikePattern('a\\b%')).toBe('a\\\\b\\%')
  })
})
