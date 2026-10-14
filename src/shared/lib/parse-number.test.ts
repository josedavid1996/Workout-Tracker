import { describe, expect, it } from 'vitest'
import { parseNumberInput } from './parse-number'

describe('parseNumberInput', () => {
  it('parses whole numbers and decimals, with a dot or a comma', () => {
    expect(parseNumberInput('60')).toBe(60)
    expect(parseNumberInput('62.5')).toBe(62.5)
    expect(parseNumberInput('62,5')).toBe(62.5)
    expect(parseNumberInput(' 7 ')).toBe(7)
    expect(parseNumberInput('0')).toBe(0)
  })

  it('accepts a number still being typed', () => {
    expect(parseNumberInput('62.')).toBe(62)
    expect(parseNumberInput('62,')).toBe(62)
    expect(parseNumberInput('.5')).toBe(0.5)
  })

  it('returns null for empty or non-numeric text', () => {
    for (const raw of ['', '   ', 'abc', '12kg', '1e3', '-5', '+5', '1.2.3', '1 000', '.', ',', '0x10', 'Infinity']) {
      expect(parseNumberInput(raw)).toBeNull()
    }
  })

  it('rejects decimals when only whole numbers are allowed', () => {
    expect(parseNumberInput('8', { integer: true })).toBe(8)
    expect(parseNumberInput('8.5', { integer: true })).toBeNull()
    expect(parseNumberInput('8,', { integer: true })).toBeNull()
  })

  it('rejects values under the minimum', () => {
    expect(parseNumberInput('0', { min: 1 })).toBeNull()
    expect(parseNumberInput('1', { min: 1 })).toBe(1)
  })
})
