import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../features/auth/api/use-session'

interface ProtectedRouteProps {
  children: ReactNode
}

// Redirects to /login when there is no active Supabase session. While the
// initial `getSession()` check is in flight (`loading`), renders nothing
// rather than flashing a redirect for an already-authenticated user.
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useSession()

  if (loading) return null

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
