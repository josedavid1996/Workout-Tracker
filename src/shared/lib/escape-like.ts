// Escapes user input for a Postgres LIKE/ILIKE pattern (default escape
// character `\`), so `%` and `_` typed by the user match literally instead
// of acting as wildcards.
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}
