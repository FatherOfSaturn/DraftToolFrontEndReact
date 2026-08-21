import { parseDecklist } from '../../../shared/lib/parseDecklist';
import { BASIC_LANDS } from '../../../shared/lib/basicLands';
import { scryfallApi } from '../api/scryfallApi';
import type { Card } from '../../../shared/model/cardTypes';

const BASIC_LAND_NAMES = new Set(BASIC_LANDS.map((l) => l.name.toLowerCase()));

let buildCardCounter = 0;

export function buildCard(name: string, typeLine: string): Card {
  buildCardCounter += 1;
  const cardID = `card-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${buildCardCounter}`;
  return {
    cardID,
    name,
    cmc: 0,
    type_line: typeLine,
    reveal: true,
    details: {
      set: 'IMPORT',
      set_name: 'Imported',
      scryfall_id: cardID,
      image_small: '',
      image_normal: '',
      image_flip: null,
      name,
      parsed_cost: [],
    },
  };
}

export interface ImportDecklistResult {
  cards: Card[];
  unknownNames: string[];
}

/** Maximum unique card names resolved in a single batch lookup, so a
 * pasted decklist can't turn into an unbounded backend Scryfall call. */
export const MAX_UNIQUE_NAMES_TO_FETCH = 200;

/**
 * Resolves a pasted decklist into real Card objects by looking up each
 * unique card name via the backend Scryfall batch API. Basic lands are
 * resolved locally (no API call). Quantity handling is done entirely
 * on the frontend — the API returns one Card per unique name, and we
 * duplicate it N times based on the quantity in the decklist.
 */
export async function importDecklist(text: string): Promise<ImportDecklistResult> {
  const entries = parseDecklist(text);
  const unknownNames: string[] = [];

  const uniqueNames = [...new Set(entries.map((e) => e.name))];
  const cardCache = new Map<string, Card>();

  // Resolve basic lands locally
  for (const name of uniqueNames) {
    if (BASIC_LAND_NAMES.has(name.toLowerCase())) {
      const land = BASIC_LANDS.find((l) => l.name.toLowerCase() === name.toLowerCase());
      if (land) {
        const card: Card = {
          cardID: `basic-${land.name.toLowerCase()}`,
          name: land.name,
          cmc: 0,
          type_line: `Basic Land — ${land.name}`,
          reveal: true,
          details: {
            set: 'land',
            set_name: 'Basic Land',
            scryfall_id: `basic-${land.name.toLowerCase()}`,
            image_small: land.imageUrl,
            image_normal: land.imageUrl,
            image_flip: null,
            name: land.name,
            parsed_cost: [],
          },
        };
        cardCache.set(name, card);
      }
    }
  }

  // Fetch non-land cards via the batch endpoint (single HTTP call), capped
  // so a huge paste can't hammer the backend. Names past the cap are
  // reported as unresolved rather than silently dropped.
  const nonLandNames = uniqueNames.filter((n) => !cardCache.has(n));
  const toFetch = nonLandNames.slice(0, MAX_UNIQUE_NAMES_TO_FETCH);
  if (toFetch.length < nonLandNames.length) {
    unknownNames.push(`${nonLandNames.length - toFetch.length} card names were skipped (too many unique names).`);
  }
  if (toFetch.length > 0) {
    const result = await scryfallApi.getCardsByNames(toFetch);
    for (const card of result.cards) {
      cardCache.set(card.name, card);
    }
    unknownNames.push(...result.notFound);
  }

  // Build card list with quantities, giving each instance a unique cardID
  const cards: Card[] = [];
  for (const entry of entries) {
    const card = cardCache.get(entry.name);
    if (!card) continue;

    for (let i = 0; i < entry.quantity; i++) {
      cards.push({
        ...card,
        cardID: i === 0 ? card.cardID : `${card.cardID}-${i}`,
        details: { ...card.details },
      });
    }
  }

  return { cards, unknownNames: [...new Set(unknownNames)] };
}
