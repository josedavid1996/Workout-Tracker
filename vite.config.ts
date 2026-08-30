/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow reaching the dev server from other devices on the LAN (phone
    // testing) — Vite's Host-header check otherwise resets connections
    // that arrive as `Host: <lan-ip>` instead of `localhost`.
    host: true,
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/lib/test-setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['e2e/**', 'src/**/*.d.ts', 'src/app/**'],
    },
    // `supabase/tests/**` is the Phase 11 RLS integration suite — it hits
    // the REAL Supabase instance and has its own config/script
    // (`vitest.rls.config.ts` / `npm run test:rls`). Never picked up here.
    exclude: ['e2e/**', 'supabase/tests/**', 'node_modules/**'],
  },
})
