import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test'

// `npm run e2e` (Phase 12) runs against the REAL Supabase instance, never
// mocked — see `e2e/README.md`. `dotenv/config` loads `.env` into
// `process.env` for the Playwright test process itself (the browser side
// gets the same values through Vite's own `.env` loading in `npm run dev`).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
