import { describe, expect, it } from 'vitest';
import { parseDecklist, totalCardCount } from './parseDecklist';

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
});
