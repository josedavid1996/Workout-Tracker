import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from '../features/auth/api/use-session'
import { queryClient } from './query-client'

interface AppProvidersProps {
  children: ReactNode
}

// Top-level provider composition: React Query, then the Supabase session
// (consumed by `ProtectedRoute` and any feature that needs `useSession`),
// then the router.
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  )
}
