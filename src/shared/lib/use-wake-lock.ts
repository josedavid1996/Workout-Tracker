import { useEffect } from 'react'

// Keeps the screen on while `active` (Screen Wake Lock API), so the phone
// doesn't lock between sets. Not a timer: nothing counts or fires.
//
// The browser drops the lock whenever the page is hidden (app switch, screen
// off), so it is requested again each time the page becomes visible. Where
// the API is missing or the request is refused (older iOS, battery saver)
// this silently does nothing — the screen just follows the system timeout.
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void next.release()
          return
        }
        sentinel = next
      } catch {
        // Refused by the browser — nothing to do.
      }
    }

    const handleVisibilityChange = () => {
      void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void sentinel?.release()
      sentinel = null
    }
  }, [active])
}
