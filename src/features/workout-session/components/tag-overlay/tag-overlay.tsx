import type { SetTag } from '../../../../shared/lib/countable-set'
import { Button } from '../../../../shared/ui/button'
import { Sheet } from '../../../../shared/ui/sheet'

interface TagOverlayProps {
  open: boolean
  value: SetTag
  onClose: () => void
  onSelect: (tag: SetTag) => void
}

const TAG_OPTIONS: { value: SetTag; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'warmup', label: 'Warmup' },
  { value: 'drop', label: 'Drop set' },
  { value: 'failure', label: 'Al fallo' },
]

// Small fixed-option selector, opened by tapping a set's tag label. Fixed
// option list — no dedicated unit test, same convention as `shared/ui/tabs.tsx`.
export function TagOverlay({ open, value, onClose, onSelect }: TagOverlayProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Tipo de set">
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
      </div>
    </Sheet>
  )
}
