import { useState } from 'react'
import iconExerciseGeneric from '../../../assets/icons/icon-exercise-generic.svg'
import { cx } from '../../../shared/lib/cx'

interface ExerciseThumbnailProps {
  src: string | null | undefined
  alt: string
  className?: string
}

// Single shared implementation for rendering the real `exercises.image`
// catalog photo (PR12 — a live audit found this URL was always available
// from the API but never actually rendered anywhere, only a generic
// placeholder icon). Falls back to the generic icon when the field is
// missing (some catalog rows have no photo) or when the real URL fails to
// load (`onError`), so a broken/expired link never leaves a blank box.
export function ExerciseThumbnail({ src, alt, className }: ExerciseThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const showFallback = !src || failed

  return (
    <img
      src={showFallback ? iconExerciseGeneric : src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cx('object-cover', showFallback && 'opacity-70 p-1.5', className)}
    />
  )
}
