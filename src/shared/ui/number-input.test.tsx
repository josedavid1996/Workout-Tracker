import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NumberInput } from './number-input'

function setup(props: Partial<Parameters<typeof NumberInput>[0]> = {}) {
  const onValueChange = vi.fn()
  render(<NumberInput aria-label="Peso" value={60} onValueChange={onValueChange} {...props} />)
  return { input: screen.getByLabelText(props['aria-label'] ?? 'Peso') as HTMLInputElement, onValueChange }
}

describe('NumberInput', () => {
  it('is a text field with a numeric keyboard, not a native number input', () => {
    const { input } = setup()
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(setup({ 'aria-label': 'Entero', integer: true }).input).toHaveAttribute('inputmode', 'numeric')
  })

  it('shows the current value, or nothing when there is none', () => {
    expect(setup().input.value).toBe('60')
    expect(setup({ 'aria-label': 'Vacío', value: null }).input.value).toBe('')
  })

  it('reports each valid number typed, accepting a decimal comma', () => {
    const { input, onValueChange } = setup()

    fireEvent.change(input, { target: { value: '62,5' } })

    expect(onValueChange).toHaveBeenLastCalledWith(62.5)
    expect(input.value).toBe('62,5')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('flags text that is not a number and reports no value for it', () => {
    const { input, onValueChange } = setup()

    fireEvent.change(input, { target: { value: '6a' } })

    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('reports an empty field as no value without flagging it', () => {
    const { input, onValueChange } = setup()

    fireEvent.change(input, { target: { value: '' } })

    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('goes back to showing the current value when the field loses focus', () => {
    const { input } = setup()

    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.blur(input)

    expect(input.value).toBe('60')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('uses a font size of at least 16px so mobile browsers do not zoom on focus', () => {
    expect(setup({ className: 'w-full' }).input.className).toContain('text-base')
  })
})
