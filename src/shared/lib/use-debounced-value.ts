import { useEffect, useState } from 'react'

// Generic debounce hook: returns `value` only after it has stopped changing
// for `delayMs`. Used to avoid firing a search query on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
