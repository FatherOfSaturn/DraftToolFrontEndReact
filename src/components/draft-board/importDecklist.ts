import { parseDecklist } from '../../lib/parseDecklist';
import { lookupTypeLine } from '../../lib/cardTypeLookup';
import { placeholderArt, type ArtFrameKey } from '../../lib/placeholderArt';
import type { Card } from '../../types';

/**
 * Turns pasted decklist text into real, draftable Card objects — the
 * missing piece between "a player pastes a list of names" and "the
 * card grid/pool sidebar have something to render." Reuses the same
 * small built-in name lookup table the Mulligan Simulator uses
 * (cardTypeLookup.ts) — names not in that table resolve to a generic
 * "Unknown" card rather than failing to import.
 *
 * TODO(scryfall): once a real card-lookup API exists, this is the file
 * to change — everything downstream (CardGrid, PoolSidebar) already
 * just consumes Card objects, so swapping the resolution source here
 * doesn't require touching either of those.
 */

let importCounter = 0;

/** Very rough cost guess from a type_line, just enough to pick a
 * placeholder-art tint — this is not real mana-cost parsing, since the
 * lookup table only stores type_line, not parsed_cost. Imported cards
 * get an empty parsed_cost (no color pips shown in the UI) unless/until
 * a real card database supplies one. */
function frameKeyForTypeLine(typeLine: string): ArtFrameKey {
  const lower = typeLine.toLowerCase();
  if (lower.includes('plains') || lower.includes('white')) return 'W';
  if (lower.includes('island') || lower.includes('blue')) return 'U';
  if (lower.includes('swamp') || lower.includes('black')) return 'B';
  if (lower.includes('mountain') || lower.includes('red')) return 'R';
  if (lower.includes('forest') || lower.includes('green')) return 'G';
  return 'C';
}

export interface ImportDecklistResult {
  cards: Card[];
  /** Names from the pasted text that weren't found in the lookup table
   * — these still get imported (as "Unknown" type cards), this list is
   * just for showing the same "N cards not recognized" notice the
   * Mulligan Simulator shows. */
  unknownNames: string[];
}

export function buildCard(name: string, typeLine: string, frameKey: ArtFrameKey): Card {
  importCounter += 1;
  const image = placeholderArt(name, frameKey);
  const cardID = `import-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${importCounter}`;
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
      image_small: image,
      image_normal: image,
      image_flip: null,
      name,
      parsed_cost: [],
    },
  };
}

export function importDecklist(text: string): ImportDecklistResult {
  const entries = parseDecklist(text);
  const cards: Card[] = [];
  const unknownNames: string[] = [];

  for (const entry of entries) {
    const typeLine = lookupTypeLine(entry.name);
    if (typeLine === null) unknownNames.push(entry.name);

    const resolvedTypeLine = typeLine ?? 'Unknown';
    const frameKey = typeLine ? frameKeyForTypeLine(typeLine) : 'C';

    for (let i = 0; i < entry.quantity; i++) {
      cards.push(buildCard(entry.name, resolvedTypeLine, frameKey));
    }
  }

  return { cards, unknownNames: [...new Set(unknownNames)] };
}
