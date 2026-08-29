// Extracted from `home-page.tsx` (PR11) so it can be reused by both Home
// (avatar initials from the greeting name) and the Perfil page (avatar
// initials from the resolved display name).
export function initials(name: string): string {
  return name.slice(0, 2).toUpperCase() || '??'
}
