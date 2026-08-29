import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

type IconButtonSize = 'sm' | 'md'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
}

// Unifies the circular icon-only buttons that previously had inconsistent
// border-radius per page (rounded-full / rounded-lg / rounded-xl) for the
// same visual pattern: "Volver" (routine-form), "Buscar" (routines-list),
// "Mes anterior" (history), "Compartir" (workout-summary). Always
// `rounded-full`, one shared size scale.
export function IconButton({
  size = 'sm',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
