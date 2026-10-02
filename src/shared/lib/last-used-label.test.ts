import { describe, expect, it } from 'vitest'
import { lastUsedLabel } from './last-used-label'

describe('lastUsedLabel', () => {
  it('says "hoy" for 0 days', () => {
    expect(lastUsedLabel(0)).toBe('Última vez hoy')
  })

  it('says "ayer" for 1 day', () => {
    expect(lastUsedLabel(1)).toBe('Última vez ayer')
  })

  it('says "hace n días" for 2+ days', () => {
    expect(lastUsedLabel(2)).toBe('Última vez hace 2 días')
    expect(lastUsedLabel(15)).toBe('Última vez hace 15 días')
  })

  it('keeps the "never" wording when there is no previous workout', () => {
    expect(lastUsedLabel(null)).toBe('Todavía no entrenaste esta rutina')
  })
})
