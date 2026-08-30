import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: ReactNode
}

// Generic selectable pill, extracted because the Figma design repeats this
// exact visual pattern across several screens: routines-list filter tabs
// (`02-lista-rutinas.md`), muscle-group chips on the routine form
// (`03-crear-editar-rutina.md`), and body-part/equipment filter chips on the
// exercise picker (`04-selector-ejercicio.md`) — one implementation instead
// of four ad hoc button styles.
export function Chip({ active = false, icon, className, children, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cx(
        'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-surface text-muted hover:border-accent/60',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
