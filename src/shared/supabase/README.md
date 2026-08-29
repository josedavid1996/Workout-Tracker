# shared/supabase

## `client.ts`

Supabase client instance. Reads the instance URL and anon key from Vite env vars
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Copy `.env.example` to `.env` and
fill in real values locally — never commit `.env`.

## `database.types.ts` (generated, not present in this PR)

This PR ships only the SQL migrations under `supabase/migrations/`. Nobody has run
them against the real instance yet (no service-role credentials available here), so
generated types would not reflect reality and are intentionally omitted.

Once the migrations in `supabase/migrations/` have been applied to the target
instance, generate the typed schema with the Supabase CLI:

```bash
supabase gen types typescript --project-id <project-id> \
  --schema public > src/shared/supabase/database.types.ts
```

Or, pointing directly at a local/self-hosted instance:

```bash
supabase gen types typescript --db-url postgresql://<user>:<password>@192.168.101.5:5432/postgres \
  --schema public > src/shared/supabase/database.types.ts
```

After generating the file, wire it into `client.ts`:

```ts
import type { Database } from './database.types'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

and remove the temporary `Database = Record<string, unknown>` placeholder type.
