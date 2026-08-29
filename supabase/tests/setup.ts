import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// These RLS integration tests run against the REAL Supabase instance (never
// mocked) — see `supabase/tests/README.md`. Vitest loads `.env` the same way
// Vite does (mode defaults to `test`), so this mirrors
// `src/shared/supabase/client.ts`'s env lookup exactly, just without the
// `Database` generic (not needed for raw isolation checks).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. `npm run test:rls` runs ' +
      'against the REAL Supabase instance and needs a `.env` at the repo root ' +
      '(copy `.env.example` and fill in the real anon key) before it can start.',
  )
}

const TEST_PASSWORD = 'RlsTest!Password123'

export type TestUser = {
  email: string
  password: string
  id: string
  client: SupabaseClient
}

// Creates one real auth user via `signUp()` with a unique email and returns
// a supabase-js client already authenticated as that user.
//
// `mailer_autoconfirm` is on for this instance, so `signUp()` returns an
// active session immediately (the account is confirmed on creation). If it
// ever doesn't (e.g. autoconfirm gets flipped back off), this falls back to
// an explicit `signInWithPassword()` so the helper never silently returns an
// unauthenticated client.
export async function createTestUser(label: string): Promise<TestUser> {
  const email = `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password: TEST_PASSWORD,
  })
  if (signUpError) {
    throw new Error(`signUp failed for test user "${label}" (${email}): ${signUpError.message}`)
  }

  let session = signUpData.session
  let userId = signUpData.user?.id

  if (!session) {
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email,
      password: TEST_PASSWORD,
    })
    if (signInError || !signInData.session) {
      throw new Error(
        `signUp for "${label}" (${email}) returned no session and the signInWithPassword ` +
          `fallback also failed — mailer_autoconfirm may be off on this instance: ` +
          `${signInError?.message ?? 'no session returned'}`,
      )
    }
    session = signInData.session
    userId = signInData.user.id
  }

  if (!userId) {
    throw new Error(`No user id returned for test user "${label}" (${email})`)
  }

  return { email, password: TEST_PASSWORD, id: userId, client }
}

// One row to delete during cleanup, as the owning user's client (RLS-safe —
// no service-role key needed or used anywhere in this suite).
export type Cleanup = { table: string; client: SupabaseClient; match: Record<string, string> }

// Deletes every registered row, last-created-first. Cascades already handle
// children of `routines` / `workouts` (see `on delete cascade` in
// `0001_core_schema.sql`), so callers only need to register the top-level
// rows they created plus standalone rows like `user_equipment`.
//
// Returns the list of failures instead of throwing — a partial cleanup
// failure (e.g. a row already gone) should never fail the whole suite; see
// `supabase/tests/README.md` for what this means for the real instance.
export async function runCleanup(tasks: Cleanup[]): Promise<string[]> {
  const failures: string[] = []
  for (const task of tasks.slice().reverse()) {
    const { error } = await task.client.from(task.table).delete().match(task.match)
    if (error) {
      failures.push(`${task.table} ${JSON.stringify(task.match)}: ${error.message}`)
    }
  }
  return failures
}
