import { describe, expect, it } from 'vitest'
import { resolveDisplayName } from './resolve-display-name'

// New pure logic (PR11): prefer a real, user-set `display_name` from
// Supabase `user_metadata` over the email-derived `greetingName()` heuristic
// — but only when it is actually a non-empty string once trimmed.
describe('resolveDisplayName', () => {
  it('uses the metadata display name when present and non-empty', () => {
    expect(resolveDisplayName('Roberto', 'juan@example.com')).toBe('Roberto')
  })

  it('falls back to greetingName(email) when display name is undefined', () => {
    expect(resolveDisplayName(undefined, 'juan@example.com')).toBe('Juan')
  })

  it('falls back to greetingName(email) when display name is an empty/whitespace string', () => {
    expect(resolveDisplayName('   ', 'juan@example.com')).toBe('Juan')
  })

  it('trims surrounding whitespace from a valid display name', () => {
    expect(resolveDisplayName('  Roberto  ', 'juan@example.com')).toBe('Roberto')
  })
})
