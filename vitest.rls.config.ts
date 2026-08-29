import { defineConfig } from 'vitest/config'

// Separate Vitest project for the RLS integration suite (Phase 11) — see
// `supabase/tests/README.md`. Kept out of `vite.config.ts` / `npm run test`
// on purpose: this suite hits the REAL Supabase instance over the network
// and needs a real `.env`, unlike every other test in this repo.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['supabase/tests/**/*.rls.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
