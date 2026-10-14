import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './use-wake-lock'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useWakeLock', () => {
  const release = vi.fn(() => Promise.resolve())
  const request = vi.fn(() => Promise.resolve({ release }))

  beforeEach(() => {
    release.mockClear()
    request.mockClear()
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock')
  })

  it('requests a screen wake lock while active and releases it on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true))
    await flush()
    expect(request).toHaveBeenCalledWith('screen')

    unmount()
    await flush()
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('does not request a lock while inactive', async () => {
    renderHook(() => useWakeLock(false))
    await flush()
    expect(request).not.toHaveBeenCalled()
  })

  it('re-acquires the lock when the page becomes visible again', async () => {
    renderHook(() => useWakeLock(true))
    await flush()
    expect(request).toHaveBeenCalledTimes(1)

    setVisibility('hidden')
    await flush()
    expect(request).toHaveBeenCalledTimes(1)

    setVisibility('visible')
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('does nothing when the browser has no Wake Lock API or refuses the request', async () => {
    request.mockRejectedValueOnce(new Error('NotAllowedError'))
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
    await flush()

    Reflect.deleteProperty(navigator, 'wakeLock')
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
  })
})
