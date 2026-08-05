import { describe, expect, it } from 'vitest';
import { computeClassicCardsLeft } from './classicStats';
import type { ClassicPlayer } from './classicGameTypes';
import type { Card, CardDetail } from '../../../shared/model/cardTypes';

function detail(name: string): CardDetail {
  return {
    set: 'STA',
    set_name: 'Strixhaven Archive',
    scryfall_id: `id-${name}`,
    image_small: '',
    image_normal: '',
    image_flip: null,
    name,
    parsed_cost: ['1'],
  };
}

function card(name: string): Card {
  return { cardID: `card-${name}`, name, cmc: 1, type_line: 'Instant', reveal: true, details: detail(name) };
}

function player(overrides: Partial<ClassicPlayer>): ClassicPlayer {
  return {
    playerName: 'Alice',
    accountID: 'acc-1',
    draftOrderNumber: 0,
    dealtCardPacks: [
      { packNumber: 0, cardsInPack: [card('a'), card('b'), card('c'), card('d')], originalCardsInPack: 4, doubleDraftedFlag: false },
      { packNumber: 1, cardsInPack: [card('e'), card('f'), card('g'), card('h')], originalCardsInPack: 4, doubleDraftedFlag: false },
      { packNumber: 2, cardsInPack: [card('i'), card('j'), card('k'), card('l')], originalCardsInPack: 4, doubleDraftedFlag: false },
    ],
    activeCardPacks: [],
    cardsDrafted: [],
    ...overrides,
  };
}

describe('computeClassicCardsLeft', () => {
  it('returns packsPerPlayer × cardsPerPack when nothing drafted yet', () => {
    expect(computeClassicCardsLeft(player({}))).toBe(12);
  });

  it('subtracts the number of cards already drafted', () => {
    const drafted = [card('a'), card('b'), card('c')];
    expect(computeClassicCardsLeft(player({ cardsDrafted: drafted }))).toBe(9);
  });

  it('handles an empty dealtCardPacks list defensively', () => {
    expect(computeClassicCardsLeft(player({ dealtCardPacks: [], cardsDrafted: [card('a')] }))).toBe(-1);
  });
});
