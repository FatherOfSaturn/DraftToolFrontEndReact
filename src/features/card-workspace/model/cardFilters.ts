import type { Card } from '../../../shared/model/cardTypes';

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G';
export type CmcBucket = '0' | '1' | '2' | '3' | '4' | '5+';

const COLOR_FROM_SYMBOL: Record<string, ManaColor> = { W: 'W', U: 'U', B: 'B', R: 'R', G: 'G' };

/** Derives a card's color identity from its parsed_cost symbols. */
export function cardColors(card: Card): ManaColor[] {
  const symbols = new Set(
    card.details.parsed_cost.map((s) => s.toUpperCase()).filter((s) => s in COLOR_FROM_SYMBOL)
  );
  return [...symbols].map((s) => COLOR_FROM_SYMBOL[s]);
}

/** Buckets a converted mana cost into one of the fixed CMC filter buckets. */
export function cmcBucketFor(cmc: number): CmcBucket {
  if (cmc >= 5) return '5+';
  return String(cmc) as CmcBucket;
}

export interface CardFilterState {
  search: string;
  activeColors: ManaColor[];
  activeCmc: CmcBucket | null;
  activeType: string | null;
}

export interface CardFilterControls extends CardFilterState {
  onSearchChange: (value: string) => void;
  onToggleColor: (color: ManaColor) => void;
  onToggleCmc: (bucket: CmcBucket) => void;
  onToggleType: (type: string) => void;
}

/**
 * Applies a search/color/CMC/type filter set to a card list. Pure and
 * dependency-free so it's trivial to unit test and reuse anywhere a card
 * list needs filtering — currently the draft board (filters the current
 * pack) and the deck builder (filters the decklist) via the
 * `useCardFilters` hook, which previously each had their own copy of
 * this exact predicate.
 */
export function filterCards(cards: Card[], { search, activeColors, activeCmc, activeType }: CardFilterState): Card[] {
  return cards.filter((card) => {
    if (search && !card.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeType && !card.type_line.includes(activeType)) return false;
    if (activeCmc && cmcBucketFor(card.cmc) !== activeCmc) return false;
    if (activeColors.length > 0) {
      const colors = cardColors(card);
      if (!colors.some((c) => activeColors.includes(c))) return false;
    }
    return true;
  });
}

export const COLOR_PIP_STYLES: Record<ManaColor, string> = {
  W: 'bg-[#F0F2C0]/20 hover:bg-[#F0F2C0]/40 text-[#F0F2C0] border-[#F0F2C0]/30',
  U: 'bg-secondary-container/30 hover:bg-secondary-container/50 text-secondary border-secondary/30',
  B: 'bg-surface-variant hover:bg-on-surface-variant/20 text-white border-outline-variant/30',
  R: 'bg-error-container/30 hover:bg-error-container/50 text-error border-error/30',
  G: 'bg-green-700/20 hover:bg-green-700/40 text-green-400 border-green-700/30',
};

export const COLOR_PIP_ACTIVE: Record<ManaColor, string> = {
  W: 'bg-[#F0F2C0]/50 border-[#F0F2C0]',
  U: 'bg-secondary-container/60 border-secondary',
  B: 'bg-on-surface-variant/30 border-white',
  R: 'bg-error-container/60 border-error',
  G: 'bg-green-700/60 border-green-400',
};

export const CARD_COLOR_BADGE: Record<string, string> = {
  W: 'bg-yellow-200 text-yellow-900',
  U: 'bg-blue-600',
  B: 'bg-gray-700',
  R: 'bg-red-600',
  G: 'bg-green-600',
};

export const TYPE_FILTERS = ['Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land'];
