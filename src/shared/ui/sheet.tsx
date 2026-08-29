import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

// Mobile-first bottom sheet: slides up from the bottom of the viewport,
// dismissible via backdrop click or Escape. Intentionally not a portal —
// kept simple and rendered inline by the page that owns it.
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl border-t border-border bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {title && (
          <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-foreground">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
