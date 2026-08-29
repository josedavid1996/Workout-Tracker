import { render, screen, waitFor } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionProvider, useSession } from './use-session'

const unsubscribe = vi.fn()
let authStateCallback: ((event: string, session: Session | null) => void) | undefined

vi.mock('../../../shared/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn((callback: (event: string, session: Session | null) => void) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe } } }
      }),
    },
  },
}))

import { supabase } from '../../../shared/supabase/client'

const fakeSession = { access_token: 'abc', user: { id: 'user-1' } } as unknown as Session

function Probe() {
  const { session, loading } = useSession()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="session">{session ? session.user.id : 'none'}</span>
    </div>
  )
}

describe('useSession / SessionProvider', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getSession).mockReset()
    vi.mocked(supabase.auth.onAuthStateChange).mockClear()
    unsubscribe.mockClear()
    authStateCallback = undefined
  })

  it('starts in a loading state and resolves to no session when getSession returns null', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('session').textContent).toBe('none')
  })

  it('resolves the session returned by getSession', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    } as never)

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('session').textContent).toBe('user-1'))
  })

  it('updates the session when onAuthStateChange fires', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    authStateCallback?.('SIGNED_IN', fakeSession)

    await waitFor(() => expect(screen.getByTestId('session').textContent).toBe('user-1'))
  })

  it('unsubscribes from auth state changes on unmount', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)

    const { unmount } = render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('throws when useSession is called outside a SessionProvider', () => {
    function Bare() {
      useSession()
      return null
    }

    expect(() => render(<Bare />)).toThrow('useSession must be used within a SessionProvider')
  })
})
