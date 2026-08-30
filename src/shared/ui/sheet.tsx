import type { ReactNode } from 'react'
import { useEffect } from 'react'
import iconClose from '../../assets/icons/icon-close.svg'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

// Mobile-first bottom sheet: slides up from the bottom of the viewport,
// dismissible via backdrop click, Escape, or the header close button.
// `max-h-[85dvh] overflow-y-auto` on the panel keeps tall content (e.g. a
// Quick Reference sheet's gif + instructions) from growing past the
// viewport — without it, the panel could push its own dismiss affordances
// off-screen with nothing left on-screen to tap. Intentionally not a
// portal — kept simple and rendered inline by the page that owns it.
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
      <div className="thin-scrollbar relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="font-display text-lg uppercase tracking-wide text-foreground">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <img src={iconClose} alt="" className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
