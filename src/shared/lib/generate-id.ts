// `crypto.randomUUID()` only exists in secure contexts (HTTPS or
// localhost) — the dev server is deliberately exposed over plain HTTP on
// the LAN for phone testing (see `vite.config.ts`'s `host`/`allowedHosts`),
// so calling it directly there throws and, with no error boundary in the
// app, blanks the whole screen. This id is only ever used as a local React
// list key (never persisted), so a non-cryptographic fallback is fine.
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
