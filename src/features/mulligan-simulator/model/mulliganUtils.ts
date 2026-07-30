import { categorizeTypeLine, type CardCategory } from '../../../shared/lib/cardCategory';
import type { Card } from '../../../shared/model/cardTypes';

export interface ExpandedCard {
  name: string;
  category: CardCategory;
  cmc: number;
  imageUrl?: string;
}

/** Build ExpandedCard[] from resolved Card objects (e.g. from the Scryfall API). */
export function expandFromCards(cards: Card[]): ExpandedCard[] {
  return cards.map((card) => ({
    name: card.name,
    category: categorizeTypeLine(card.type_line),
    cmc: card.cmc,
    imageUrl: card.details.image_small || card.details.image_normal || undefined,
  }));
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
