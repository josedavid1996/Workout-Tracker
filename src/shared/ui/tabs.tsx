import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
  children?: ReactNode
}

// Minimal controlled tab bar — the parent owns `value`/`onChange`, this
// component holds no internal state. No roving keyboard focus or compound
// context API; sufficient for this PR's login/signup toggle use case.
export function Tabs({ tabs, value, onChange, children }: TabsProps) {
  return (
    <div>
      <div role="tablist" className="flex gap-1 rounded-md border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === value}
            onClick={() => onChange(tab.id)}
            className={cx(
              'flex-1 rounded-md px-3 py-1.5 font-display text-sm uppercase tracking-wide transition-colors',
              tab.id === value ? 'bg-accent text-background' : 'text-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
