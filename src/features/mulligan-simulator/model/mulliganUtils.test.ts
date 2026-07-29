import { afterEach, describe, expect, it, vi } from 'vitest';
import { expandFromCards, shuffle } from './mulliganUtils';
import type { Card } from '../../../shared/model/cardTypes';

afterEach(() => vi.restoreAllMocks());

function fakeCard(name: string, typeLine: string): Card {
  return {
    cardID: name,
    name,
    cmc: 0,
    type_line: typeLine,
    reveal: true,
    details: {
      set: 'test',
      set_name: 'Test',
      scryfall_id: name,
      image_small: '',
      image_normal: '',
      image_flip: null,
      name,
      parsed_cost: [],
    },
  };
}

describe('mulligan utilities', () => {
  it('expands resolved Card objects into categorized cards', () => {
    const cards = [fakeCard('Island', 'Basic Land — Island'), fakeCard('Island', 'Basic Land — Island')];
    expect(expandFromCards(cards)).toEqual([
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
