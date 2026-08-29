// Swaps the item at `index` with its neighbor in the given direction.
// Returns the same order (a new array, never mutated in place) when the
// move would go out of bounds — e.g. moving the first item up.
export function moveDraft<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= items.length) return [...items]

  const next = [...items]
  ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
  return next
}
