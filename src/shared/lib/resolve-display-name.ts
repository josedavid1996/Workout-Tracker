import { greetingName } from './greeting-name'

// PR11: prefers a real, user-set `display_name` (Supabase `user_metadata`,
// written via `updateDisplayName()`) over the email-derived `greetingName()`
// heuristic — used by both Home and the Perfil page so the two never
// disagree on how a name is shown.
export function resolveDisplayName(
  metadataDisplayName: string | undefined | null,
  email: string | undefined,
): string {
  const trimmed = metadataDisplayName?.trim()
  if (trimmed) return trimmed
  return greetingName(email)
}
