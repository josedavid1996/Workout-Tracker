import { describe, expect, it } from 'vitest'
import { daysSince } from './days-since'

describe('daysSince', () => {
  it('returns 0 for the same instant', () => {
    expect(daysSince('2026-01-10T10:00:00Z', '2026-01-10T10:00:00Z')).toBe(0)
  })

  it('returns 0 for a same-day earlier time (partial day)', () => {
    expect(daysSince('2026-01-10T23:00:00Z', '2026-01-10T10:00:00Z')).toBe(0)
  })

  it('returns whole days elapsed, floored', () => {
    expect(daysSince('2026-01-01T00:00:00Z', '2026-01-04T12:00:00Z')).toBe(3)
  })

  it('defaults the reference date to now when omitted', () => {
    const now = new Date().toISOString()
    expect(daysSince(now)).toBe(0)
  })

  it('never returns a negative number for a past reference (future "past" date)', () => {
    expect(daysSince('2026-01-10T00:00:00Z', '2026-01-05T00:00:00Z')).toBe(0)
  })
})
