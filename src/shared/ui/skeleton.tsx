import { cx } from '../lib/cx'

interface SkeletonProps {
  className?: string
}

// Simple pulsing placeholder block — reused by every page's "loading"
// variant (06/07/08/09 in `design/figma-reference/`) instead of repeating
// ad hoc `animate-pulse` divs per page.
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cx('animate-pulse rounded-md bg-surface-2', className)} />
}
