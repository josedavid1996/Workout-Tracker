import type { SetTag } from '../../../../shared/lib/countable-set'
import { Button } from '../../../../shared/ui/button'
import { Sheet } from '../../../../shared/ui/sheet'

interface TagOverlayProps {
  open: boolean
  value: SetTag
  onClose: () => void
  onSelect: (tag: SetTag) => void
  // Correction actions for the same set, shown under the tag options when
  // provided: undo a completed set, or remove the row altogether.
  onUncomplete?: () => void
  onDelete?: () => void
}

const TAG_OPTIONS: { value: SetTag; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Warmup' },
  { value: 'drop', label: 'Drop set' },
  { value: 'failure', label: 'Al fallo' },
]

// The set's menu, opened by tapping its number: a fixed tag selector plus
// the optional correction actions. Fixed option list — no dedicated unit
// test, same convention as `shared/ui/tabs.tsx`.
export function TagOverlay({ open, value, onClose, onSelect, onUncomplete, onDelete }: TagOverlayProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Opciones del set">
      <div className="flex flex-col gap-2">
        {TAG_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={option.value === value ? 'primary' : 'secondary'}
            onClick={() => {
              onSelect(option.value)
              onClose()
            }}
          >
            {option.label}
          </Button>
        ))}
        {(onUncomplete || onDelete) && <span aria-hidden="true" className="my-1 h-px bg-border" />}
        {onUncomplete && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onUncomplete()
              onClose()
            }}
          >
            Desmarcar set
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            className="text-red-300"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            Eliminar set
          </Button>
        )}
      </div>
    </Sheet>
  )
}
