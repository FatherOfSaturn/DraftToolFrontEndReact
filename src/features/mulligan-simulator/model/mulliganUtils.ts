import { categorizeTypeLine, type CardCategory } from '../../../shared/lib/cardCategory';
import { lookupTypeLine } from '../../../shared/lib/cardTypeLookup';
import type { DecklistEntry } from '../../../shared/lib/parseDecklist';

export interface ExpandedCard {
  name: string;
  category: CardCategory;
}

export function expandDecklist(entries: DecklistEntry[]): ExpandedCard[] {
  const expanded: ExpandedCard[] = [];
  for (const entry of entries) {
    const typeLine = lookupTypeLine(entry.name);
    const category = categorizeTypeLine(typeLine);
    for (let i = 0; i < entry.quantity; i++) {
      expanded.push({ name: entry.name, category });
    }
  }
  return expanded;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
