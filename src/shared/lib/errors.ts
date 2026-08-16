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

/**
 * Maps a draft failure to a short, human-readable message suitable for a
 * toast. Backend messages are often raw REST dumps, so we never surface them
 * verbatim — instead we sniff for common causes and fall back to a generic,
 * friendly line.
 */
export function describeDraftError(err: unknown): string {
  const raw = getErrorMessage(err);
  const lower = raw.toLowerCase();

  if (lower.includes('401') || lower.includes('unauthor')) {
    return 'Your draft session has expired. Refresh the page to continue.';
  }
  if (
    lower.includes('token') ||
    lower.includes('not your') ||
    lower.includes('draft for') ||
    lower.includes('another player') ||
    lower.includes('other player') ||
    lower.includes('drafted by')
  ) {
    return 'You cannot draft for other players while you are logged in.';
  }
  return 'That pick could not be completed. Please try again.';
}
