import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-background hover:bg-accent/90',
  secondary: 'border border-border bg-surface-2 text-foreground hover:border-accent/60',
  ghost: 'bg-transparent text-foreground hover:bg-surface',
  // No background/border/padding/rounding of its own — used for header-style
  // actions (e.g. "Guardar"/"Terminar") that are plain colored text, not a
  // filled/bordered control. Callers own their own typography (font, size,
  // color, weight) via `className` instead of inheriting `sizeClasses`.
  text: 'bg-transparent',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const isText = variant === 'text'

  return (
    <button
      type={type}
      className={cx(
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        !isText && 'rounded-md font-medium',
        variantClasses[variant],
        !isText && sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
