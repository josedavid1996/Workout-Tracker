import { createClient } from '@supabase/supabase-js'

// Types are generated once migrations are applied against the real instance.
// See `src/shared/supabase/README.md` for the generation command.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- placeholder until generated
type Database = Record<string, unknown>

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in the values.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
