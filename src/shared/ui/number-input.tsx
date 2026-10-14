import type { InputHTMLAttributes } from 'react'
import { useState } from 'react'
import { cx } from '../lib/cx'
import { parseNumberInput } from '../lib/parse-number'
import { Input } from './input'

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode' | 'min'> {
  label?: string
  error?: string
  // `null` = no value; the field shows empty.
  value: number | null
  // Called on every edit with the parsed number, or `null` while the text is
  // empty or not a valid number.
  onValueChange: (value: number | null) => void
  // Whole numbers only (reps, counts).
  integer?: boolean
  // Smallest accepted value.
  min?: number
}

// Numeric field built on a TEXT input: a native `type="number"` lets the
// browser decide what is valid (and silently reports "" for anything it
// rejects), changes value on scroll, and renders spinners. Here the text is
// kept exactly as typed, validated by `parseNumberInput`, and flagged
// (`aria-invalid`, red border) while it is not a number. `inputMode` still
// brings up the numeric keypad on phones.
export function NumberInput({
  value,
  onValueChange,
  integer = false,
  min,
  className,
  onBlur,
  ...props
}: NumberInputProps) {
  // What the user is typing; `null` when not editing, so the field then
  // follows `value` (including changes made elsewhere).
  const [draft, setDraft] = useState<string | null>(null)

  const text = draft ?? (value === null ? '' : String(value))
  const invalid = draft !== null && draft.trim() !== '' && parseNumberInput(draft, { integer, min }) === null

  return (
    <Input
      {...props}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={text}
      aria-invalid={invalid || props['aria-invalid'] || undefined}
      className={cx(invalid && 'border-red-500', className)}
      onChange={(event) => {
        setDraft(event.target.value)
        onValueChange(parseNumberInput(event.target.value, { integer, min }))
      }}
      onBlur={(event) => {
        setDraft(null)
        onBlur?.(event)
      }}
    />
  )
}
