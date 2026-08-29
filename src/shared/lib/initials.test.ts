import { describe, expect, it } from 'vitest'
import { initials } from './initials'

// Approval tests: capture the pre-existing `home-page.tsx` behavior being
// extracted here unchanged (PR11).
describe('initials', () => {
  it('takes the first 2 characters, uppercased', () => {
    expect(initials('Juan')).toBe('JU')
  })

  it('falls back to "??" for an empty string', () => {
    expect(initials('')).toBe('??')
  })
})
