import { describe, expect, it } from 'vitest';
import {
  MAX_DECKLIST_CHARS,
  MAX_DECKLIST_LINES,
  MAX_QUANTITY_PER_LINE,
  parseDecklist,
  totalCardCount,
} from './parseDecklist';

describe('parseDecklist', () => {
  it('parses common formats and ignores headings and comments', () => {
    const entries = parseDecklist(`
      Deck
      4 Counterspell
      2x Brainstorm
      1 Lightning Bolt (STA) 123
      // ignored
      # ignored too
    `);

    expect(entries).toEqual([
      { quantity: 4, name: 'Counterspell' },
      { quantity: 2, name: 'Brainstorm' },
      { quantity: 1, name: 'Lightning Bolt' },
    ]);
    expect(totalCardCount(entries)).toBe(7);
  });

  it('caps an absurd per-line quantity', () => {
    const entries = parseDecklist(`9999999999 Island`);
    expect(entries).toEqual([{ quantity: MAX_QUANTITY_PER_LINE, name: 'Island' }]);
  });

  it('caps the number of parsed lines', () => {
    const lines = Array.from({ length: MAX_DECKLIST_LINES + 500 }, (_, i) => `1 Card ${i}`).join('\n');
    expect(parseDecklist(lines).length).toBe(MAX_DECKLIST_LINES);
  });

  it('truncates oversized pastes before parsing', () => {
    const huge = `1 Island\n`.repeat(MAX_DECKLIST_CHARS);
    expect(parseDecklist(huge).length).toBeLessThanOrEqual(MAX_DECKLIST_LINES);
  });
});
