export interface DecklistEntry {
  quantity: number;
  name: string;
}

/**
 * Parses standard MTG decklist text format:
 *   4 Counterspell
 *   4 Brainstorm
 *   20 Island
 *
 * Also tolerates a few common variants people paste from other tools:
 *   4x Counterspell
 *   4 Counterspell (STA) 123     <- set code / collector number suffix, ignored
 *   // comment lines and blank lines are skipped
 *   Sideboard / Deck headers are skipped (no quantity prefix to parse)
 */
export function parseDecklist(text: string): DecklistEntry[] {
  const entries: DecklistEntry[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('//') || line.startsWith('#')) continue;

    const match = line.match(/^(\d+)x?\s+(.+)$/i);
    if (!match) continue; // lines without a leading quantity (e.g. "Deck", "Sideboard") are skipped

    const quantity = parseInt(match[1], 10);
    let name = match[2].trim();

    // Strip a trailing set-code/collector-number suffix like "(STA) 123"
    // or "(M21)" that some deck export tools append.
    name = name.replace(/\s*\([A-Za-z0-9]{2,5}\)\s*\d*\s*$/, '').trim();

    if (quantity > 0 && name) {
      entries.push({ quantity, name });
    }
  }

  return entries;
}

/** Total card count across all entries — useful before you know real deck size. */
export function totalCardCount(entries: DecklistEntry[]): number {
  return entries.reduce((sum, e) => sum + e.quantity, 0);
}
