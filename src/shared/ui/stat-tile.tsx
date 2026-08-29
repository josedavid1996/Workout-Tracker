import { cx } from '../lib/cx'

interface StatTileProps {
  label: string
  value: string
  valueClassName?: string
}

// The 3-tile stat row repeats on Home (Sesiones/Volumen/PRs,
// `01-home.md`) — extracted as its own reusable primitive rather than
// three copies of the same `bg-surface border-border` block.
export function StatTile({ label, value, valueClassName }: StatTileProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border bg-surface px-2 py-3 text-center">
      <span className={cx('font-display text-2xl font-bold text-foreground', valueClassName)}>{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </div>
  )
}
