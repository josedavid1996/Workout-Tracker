/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // `devOptions.enabled` runs the service worker under `npm run dev`
      // too (not just the production build) — this app is mostly used and
      // tested from a phone over LAN, so being able to verify install/
      // offline behavior without a full build round-trip is worth the
      // extra `dev-dist/` output (gitignored).
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'Workout Tracker',
        short_name: 'Workout Tracker',
        description: 'Vite + React workout tracking app, backed by a self-hosted Supabase instance.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Matches `index.css`'s `--color-background` / `--color-accent` —
        // background_color is the splash-screen color while the OS loads
        // the app shell, theme_color tints the OS status/title bar.
        background_color: '#0f172a',
        theme_color: '#2563eb',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Only the shared, read-only `exercises` catalog is cached for
        // offline/flaky-network use (it rarely changes and is the same for
        // every user). Everything owner-scoped — routines, workouts, sets —
        // is deliberately left off this list: those must always hit the
        // network fresh, never serve a stale or cross-session cached read.
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/rest/v1/exercises'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'exercises-catalog',
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
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
