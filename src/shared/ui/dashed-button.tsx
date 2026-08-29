import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

// Shared "add something" pattern (dashed border, e.g. "Agregar ejercicio" /
// "Agregar set") that was previously duplicated with different radii/colors
// per page. Only owns the structural shape (flex layout, dashed border,
// disabled state) — typography (size, color, case, padding) is fully
// owned by the caller via `className`, since existing call sites already
// differ in those without differing in the underlying pattern.
export function DashedButton({
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        'flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border transition-colors hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
