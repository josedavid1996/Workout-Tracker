import { createClient } from '@supabase/supabase-js'

// Types are generated once migrations are applied against the real instance.
// See `src/shared/supabase/README.md` for the generation command.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- placeholder until generated
type Database = Record<string, unknown>

// An empty VITE_SUPABASE_URL means "same origin": the Docker image serves the
// app behind nginx, which proxies the Supabase paths (see `nginx.conf`).
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.location.origin
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in the values.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
