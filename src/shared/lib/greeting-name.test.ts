import { describe, expect, it } from 'vitest'
import { greetingName } from './greeting-name'

// Approval tests: capture the pre-existing `home-page.tsx` behavior being
// extracted here unchanged (PR11), so any future change to this heuristic is
// an intentional, visible diff.
describe('greetingName', () => {
  it('capitalizes the email local-part', () => {
    expect(greetingName('juan@example.com')).toBe('Juan')
  })

  it('falls back to "atleta" when there is no email', () => {
    expect(greetingName(undefined)).toBe('atleta')
  })
})
