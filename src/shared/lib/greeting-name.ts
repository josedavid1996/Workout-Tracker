// Heuristic (documented, per design/figma-reference/01-home.md): derives a
// display name from the session email's local-part — used as the fallback
// when no `display_name` has been set in `user_metadata` (see
// `resolve-display-name.ts`). Extracted from `home-page.tsx` (PR11) so it
// can be reused by both Home and the Perfil page.
export function greetingName(email: string | undefined): string {
  if (!email) return 'atleta'
  const localPart = email.split('@')[0]
  return localPart.charAt(0).toUpperCase() + localPart.slice(1)
}
