import type { Card } from '../../../shared/model/cardTypes';

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
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
  activeCmc: CmcBucket[];
  activeType: string[];
}

export interface CardFilterControls extends CardFilterState {
  onSearchChange: (value: string) => void;
  onToggleColor: (color: ManaColor) => void;
  onToggleCmc: (bucket: CmcBucket) => void;
  onToggleType: (type: string) => void;
}

export function filterCards(cards: Card[], { search, activeColors, activeCmc, activeType }: CardFilterState): Card[] {
  return cards.filter((card) => {
    if (search && !card.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeType.length > 0) {
      const matchesType = activeType.some((t) => {
        if (t === 'Other') {
          const knownTypes = ['Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Planeswalker', 'Battle'];
          return !knownTypes.some((kt) => card.type_line.includes(kt));
        }
        return card.type_line.includes(t);
      });
      if (!matchesType) return false;
    }
    if (activeCmc.length > 0 && !activeCmc.includes(cmcBucketFor(card.cmc))) return false;
    if (activeColors.length > 0) {
      const colors = cardColors(card);
      if (activeColors.includes('C')) {
        if (colors.length > 0 && !colors.some((c) => activeColors.includes(c))) return false;
      } else {
        if (!colors.some((c) => activeColors.includes(c))) return false;
      }
    }
    return true;
  });
}

export const COLOR_PIP_STYLES: Record<ManaColor, string> = {
  W: 'bg-amber-400 text-amber-950 border-amber-600/40 hover:bg-amber-300',
  U: 'bg-blue-600 text-white border-blue-500/60 hover:bg-blue-500',
  B: 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700',
  R: 'bg-red-600 text-white border-red-500/60 hover:bg-red-500',
  G: 'bg-green-700 text-white border-green-600/60 hover:bg-green-600',
  C: 'bg-gray-600 text-white border-gray-500/60 hover:bg-gray-500',
};

export const COLOR_PIP_ACTIVE: Record<ManaColor, string> = {
  W: 'bg-amber-300 text-amber-950 border-2 border-amber-800 ring-2 ring-amber-500',
  U: 'bg-blue-400 text-blue-950 border-2 border-blue-800 ring-2 ring-blue-400',
  B: 'bg-gray-500 text-white border-2 border-gray-950 ring-2 ring-gray-300',
  R: 'bg-red-400 text-red-950 border-2 border-red-800 ring-2 ring-red-400',
  G: 'bg-green-500 text-green-950 border-2 border-green-800 ring-2 ring-green-500',
  C: 'bg-gray-400 text-gray-900 border-2 border-gray-700 ring-2 ring-gray-400',
};

export const CARD_COLOR_BADGE: Record<string, string> = {
  W: 'bg-yellow-200 text-yellow-900',
  U: 'bg-blue-600',
  B: 'bg-gray-700',
  R: 'bg-red-600',
  G: 'bg-green-600',
  C: 'bg-gray-600',
};

export const TYPE_FILTERS = ['Creature', 'Sorcery', 'Instant', 'Artifact', 'Enchantment', 'Land', 'Planeswalker', 'Battle', 'Other'] as const;
