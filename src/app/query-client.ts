import { QueryClient } from '@tanstack/react-query'

// Shared React Query client instance. Default options are conservative
// placeholders; feature PRs may override per-query as real data needs emerge.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
