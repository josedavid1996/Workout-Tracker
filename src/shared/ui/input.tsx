import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from '../lib/cx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-display text-sm uppercase tracking-wide text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cx(
          'rounded-md border border-border bg-surface px-3 py-2 font-mono text-foreground placeholder:text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent/50',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  )
}
