import { describe, expect, it } from 'vitest';
import type { Card } from '../../../shared/model/cardTypes';
import { cardColors, cmcBucketFor, filterCards } from './cardFilters';

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    cardID: 'card-1',
    name: 'Lightning Bolt',
    cmc: 1,
    type_line: 'Instant',
    reveal: false,
    details: {
      set: 'TST',
      set_name: 'Test',
      scryfall_id: 'scryfall-1',
      image_small: '',
      image_normal: '',
      image_flip: null,
      name: 'Lightning Bolt',
      parsed_cost: ['R'],
    },
    ...overrides,
  };
}

describe('card filters', () => {
  it('derives color and CMC buckets', () => {
    expect(cardColors(createCard())).toEqual(['R']);
    expect(cmcBucketFor(7)).toBe('5+');
  });

  it('combines name, color, CMC, and type filters', () => {
    const bolt = createCard();
    const island = createCard({
      cardID: 'card-2',
      name: 'Island',
      cmc: 0,
      type_line: 'Basic Land',
      details: { ...bolt.details, name: 'Island', parsed_cost: [] },
    });

    expect(filterCards([bolt, island], {
      search: 'bolt',
      activeColors: ['R'],
      activeCmc: ['1'],
      activeType: ['Instant'],
    })).toEqual([bolt]);
  });
});
