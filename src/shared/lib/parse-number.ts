// Text typed into a numeric field → number, or `null` when it isn't one.
//
// Numeric fields are plain text inputs (see `shared/ui/number-input.tsx`), so
// the validation a native `type="number"` did lives here: digits with at
// most one decimal separator. Both "." and "," are accepted — phone keypads
// show one or the other depending on the system language. A number still
// being typed ("62.") counts as its value so far. No sign, exponent or
// thousands separator.
const DECIMAL_PATTERN = /^(\d+[.,]?\d*|[.,]\d+)$/
const INTEGER_PATTERN = /^\d+$/

export type ParseNumberOptions = {
  // Whole numbers only (reps, counts).
  integer?: boolean
  // Smallest accepted value; anything below is `null`.
  min?: number
}

export function parseNumberInput(raw: string, { integer = false, min }: ParseNumberOptions = {}): number | null {
  const text = raw.trim()
  if (!(integer ? INTEGER_PATTERN : DECIMAL_PATTERN).test(text)) return null

  const value = Number(text.replace(',', '.'))
  if (!Number.isFinite(value)) return null
  if (min !== undefined && value < min) return null

  return value
}
