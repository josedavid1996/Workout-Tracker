import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'

export type AuthOutcome<T> = { data: T; error: null } | { data: null; error: string }

export type SignUpData = { user: User | null; session: Session | null }
export type SignInData = { user: User; session: Session }

// mailer_autoconfirm is disabled on this instance, so a successful signUp
// never returns an active session — the caller (login-page) must show a
// "check your email" message rather than treating this as a logged-in state.
export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthOutcome<SignUpData>> {
  const trimmedName = displayName?.trim()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    ...(trimmedName ? { options: { data: { display_name: trimmedName } } } : {}),
  })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function signIn(email: string, password: string): Promise<AuthOutcome<SignInData>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut()
  if (error) return { error: error.message }
  return { error: null }
}

// PR11: writes the user's editable display name into Supabase Auth's native
// `user_metadata` (a single free-text field does not justify a new table +
// RLS policy, unlike `user_equipment`). `useSession()`'s `onAuthStateChange`
// subscription already picks up the updated `session.user` after this
// resolves, so callers don't need to manually refetch/merge state.
export async function updateDisplayName(displayName: string): Promise<AuthOutcome<User>> {
  const { data, error } = await supabase.auth.updateUser({ data: { display_name: displayName } })
  if (error) return { data: null, error: error.message }
  return { data: data.user, error: null }
}
