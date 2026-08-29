import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { createContext, createElement, useContext, useEffect, useState } from 'react'
import { supabase } from '../../../shared/supabase/client'

interface SessionState {
  session: Session | null
  loading: boolean
}

// `.ts` (not `.tsx`) by design — the provider body uses `createElement`
// instead of JSX so this stays a plain module.
const SessionContext = createContext<SessionState | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
}

// Single source of truth for the current Supabase auth session. Wraps
// `getSession()` (initial check) + `onAuthStateChange` (live updates) so
// every consumer (e.g. `ProtectedRoute`) shares one subscription instead of
// re-implementing it. Wired in `src/app/providers.tsx`.
export function SessionProvider({ children }: SessionProviderProps) {
  const [state, setState] = useState<SessionState>({ session: null, loading: true })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false })
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  return createElement(SessionContext.Provider, { value: state }, children)
}

export function useSession(): SessionState {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
