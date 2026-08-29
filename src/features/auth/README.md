# auth

- `api/auth.ts` — `signUp` / `signIn` / `signOut` wrapping `supabase.auth`. Maps
  Supabase errors to a plain `error: string` (see `auth.test.ts`).
- `api/use-session.ts` — `SessionProvider` + `useSession()`. Single
  `getSession()` + `onAuthStateChange` subscription shared by the whole app
  (wired in `src/app/providers.tsx`, consumed by `ProtectedRoute`).
- `pages/login-page.tsx` — one form, login/signup toggle (`Tabs`). Signup
  always shows a "check your email" message instead of navigating away
  (`mailer_autoconfirm` is off on this instance).
