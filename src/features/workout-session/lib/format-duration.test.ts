import { describe, expect, it } from 'vitest'
import { formatDuration } from './format-duration'

describe('formatDuration', () => {
  it('formats a sub-hour duration as minutes only', () => {
    expect(formatDuration('2026-01-01T10:00:00Z', '2026-01-01T10:42:00Z')).toBe('42 min')
  })

  it('formats an hour-plus duration as hours and minutes', () => {
    expect(formatDuration('2026-01-01T10:00:00Z', '2026-01-01T11:15:00Z')).toBe('1h 15min')
  })

  it('rounds to the nearest minute', () => {
    expect(formatDuration('2026-01-01T10:00:00Z', '2026-01-01T10:00:40Z')).toBe('1 min')
  })

  it('returns 0 min for a zero-length duration', () => {
    expect(formatDuration('2026-01-01T10:00:00Z', '2026-01-01T10:00:00Z')).toBe('0 min')
  })

  it('never returns a negative duration for an out-of-order pair', () => {
    expect(formatDuration('2026-01-01T10:05:00Z', '2026-01-01T10:00:00Z')).toBe('0 min')
  })
})
