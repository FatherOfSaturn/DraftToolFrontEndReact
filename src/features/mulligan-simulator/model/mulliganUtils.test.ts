import { afterEach, describe, expect, it, vi } from 'vitest';
import { expandDecklist, shuffle } from './mulliganUtils';

afterEach(() => vi.restoreAllMocks());

describe('mulligan utilities', () => {
  it('expands quantities into individual categorized cards', () => {
    expect(expandDecklist([{ quantity: 2, name: 'Island' }])).toEqual([
      { name: 'Island', category: 'Land' },
      { name: 'Island', category: 'Land' },
    ]);
  });

  it('shuffles a copy rather than mutating the input', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const original = [1, 2, 3];
    const result = shuffle(original);
    expect(original).toEqual([1, 2, 3]);
    expect(result).not.toBe(original);
  });
});
