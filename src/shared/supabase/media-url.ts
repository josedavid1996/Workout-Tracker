import { supabaseUrl } from './client'

// Catalog rows store absolute Storage URLs with whatever host the media was
// imported under (e.g. `http://<lan-ip>:8000/storage/v1/...`). Re-point them
// at the Supabase URL this bundle actually talks to, so media keeps loading
// when the app is reached through another origin (https tunnel, nginx proxy).
export function resolveMediaUrl(url: string | null): string | null {
  if (!url) return url
  try {
    const { pathname, search } = new URL(url)
    return pathname.startsWith('/storage/v1/') ? `${supabaseUrl}${pathname}${search}` : url
  } catch {
    return url
  }
}
