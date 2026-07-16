/**
 * Normalizes a `catch` clause's `unknown` value into a display-ready
 * string. `fetch`/API calls typically throw a real `Error`, but a
 * `catch` variable is typed `unknown` in strict mode and, rarely,
 * something else (a string, a plain object, etc.) can end up thrown —
 * this guards against all of those.
 *
 * Was previously copy-pasted inline as `err instanceof Error ? err.message
 * : String(err)` in six different places (useDraftGame, DraftSetupPage,
 * DeckBuilderPage) — centralized here so error handling stays consistent
 * as more screens do their own API calls.
 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
