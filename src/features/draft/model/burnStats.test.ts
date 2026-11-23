import { describe, expect, it } from 'vitest';
import { computeBurnCardsLeft, packOutcome, planTurn } from './burnStats';
import type { BurnPlayerSnapshot } from './burnGameTypes';
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

function pack(packNumber: number, size = 4) {
  return {
    packNumber,
    cardsInPack: Array.from({ length: size }, (_, i) => card(`${packNumber}-${i}`)),
    originalCardsInPack: size,
    doubleDraftedFlag: false,
  };
}

function player(overrides: Partial<BurnPlayerSnapshot> = {}): BurnPlayerSnapshot {
  return {
    playerName: 'Alice',
    activeCardPacks: [],
    cardsDrafted: [],
    cardsBurned: [],
    dealtCardPacks: [pack(0), pack(1), pack(2)],
    ...overrides,
  };
}

describe('planTurn', () => {
  it('drafts and burns the full quotas when enough cards remain', () => {
    expect(planTurn(6, 1, 1, 'BURN_EXTRAS')).toEqual({ draft: 1, burn: 1 });
  });

  it('treats exactly N+M as a full pass', () => {
    expect(planTurn(2, 1, 1, 'DRAFT_EXTRAS')).toEqual({ draft: 1, burn: 1 });
  });

  it('drafts everything and burns nothing when remaining <= draft quota', () => {
    expect(planTurn(1, 2, 1, 'BURN_EXTRAS')).toEqual({ draft: 1, burn: 0 });
    expect(planTurn(0, 2, 1, 'BURN_EXTRAS')).toEqual({ draft: 0, burn: 0 });
  });

  it('burns the leftovers of a partial pass under BURN_EXTRAS', () => {
    // N=2, M=2, R=3 -> draft 2, burn 1
    expect(planTurn(3, 2, 2, 'BURN_EXTRAS')).toEqual({ draft: 2, burn: 1 });
  });

  it('drafts the leftovers of a partial pass under DRAFT_EXTRAS', () => {
    // N=2, M=2, R=3 -> draft 3, burn 0
    expect(planTurn(3, 2, 2, 'DRAFT_EXTRAS')).toEqual({ draft: 3, burn: 0 });
  });
});

describe('packOutcome', () => {
  it('consumes a divisible pack in full cycles', () => {
    // P=6, N=1, M=1 -> 3 full cycles: draft 3, burn 3, none left.
    expect(packOutcome(6, 1, 1, 'BURN_EXTRAS')).toEqual({ drafted: 3, burned: 3, leftover: 0 });
  });

  it('handles a partial final cycle under BURN_EXTRAS', () => {
    // P=5, N=1, M=1 -> 2 cycles (draft 2, burn 2) + remainder 1 -> draft 1.
    expect(packOutcome(5, 1, 1, 'BURN_EXTRAS')).toEqual({ drafted: 3, burned: 2, leftover: 0 });
  });

  it('handles a partial final cycle under DRAFT_EXTRAS', () => {
    // P=4, N=2, M=2 -> 1 cycle (draft 2, burn 2), remainder 0.
    // P=5, N=2, M=2 -> 1 cycle (draft 2, burn 2) + remainder 1 -> draft 1.
    expect(packOutcome(5, 2, 2, 'DRAFT_EXTRAS')).toEqual({ drafted: 3, burned: 2, leftover: 0 });
  });

  it('burns the partial-cycle leftovers under BURN_EXTRAS with a higher burn quota', () => {
    // P=5, N=2, M=2 -> 1 cycle (draft 2, burn 2) + remainder 1. planTurn(1,2,2,BURN)
    // drafts 1 (remaining <= N), burns 0.
    expect(packOutcome(5, 2, 2, 'BURN_EXTRAS')).toEqual({ drafted: 3, burned: 2, leftover: 0 });
  });

  it('returns the whole pack as leftover when both quotas are zero', () => {
    expect(packOutcome(7, 0, 0, 'BURN_EXTRAS')).toEqual({ drafted: 0, burned: 0, leftover: 7 });
  });
});

describe('computeBurnCardsLeft', () => {
  it('returns packsPerPlayer × cardsPerPack when nothing drafted or burned yet', () => {
    expect(computeBurnCardsLeft(player())).toBe(12);
  });

  it('subtracts both drafted and burned cards', () => {
    expect(
      computeBurnCardsLeft(
        player({ cardsDrafted: [card('a'), card('b')], cardsBurned: [card('c')] })
      )
    ).toBe(9);
  });

  it('prefers cardsLeftToDraft when the backend provides it', () => {
    expect(computeBurnCardsLeft(player({ cardsLeftToDraft: 5 }))).toBe(5);
  });

  it('returns 0 without crashing when neither cardsLeftToDraft nor dealtCardPacks is present', () => {
    expect(computeBurnCardsLeft({ playerName: 'Alice', activeCardPacks: [], cardsDrafted: [], cardsBurned: [] })).toBe(0);
  });
});
