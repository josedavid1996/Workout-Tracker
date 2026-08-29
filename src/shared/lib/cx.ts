// Minimal classnames joiner: filters falsy values and joins the rest with a
// space. No dependency on `clsx`/`tailwind-merge` — this project's needs
// are simple enough to not warrant one.
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
