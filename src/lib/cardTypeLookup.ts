/**
 * Resolves a card name to a type_line string, in the same shape Scryfall
 * (and this project's existing Card.type_line field) already use, e.g.
 * "Land — Swamp Mountain" or "Creature — Elemental".
 *
 * TODO(scryfall): this is a small built-in lookup table, not a real card
 * database. You mentioned adding a Scryfall API lookup later — when you
 * do, replace the body of `lookupTypeLine` with a real fetch (e.g. POST
 * https://api.scryfall.com/cards/collection for batch name lookups) and
 * everything downstream (the category classifier, the probability
 * calculator, the UI) keeps working unchanged, since they all consume
 * type_line strings, not this table directly.
 */

const KNOWN_CARD_TYPES: Record<string, string> = {
  // Basic lands
  plains: 'Basic Land — Plains',
  island: 'Basic Land — Island',
  swamp: 'Basic Land — Swamp',
  mountain: 'Basic Land — Mountain',
  forest: 'Basic Land — Forest',

  // Common nonbasic lands
  'blood crypt': 'Land — Swamp Mountain',
  'steam vents': 'Land — Island Mountain',
  'overgrown tomb': 'Land — Swamp Forest',
  'temple garden': 'Land — Forest Plains',
  'hallowed fountain': 'Land — Plains Island',
  'watery grave': 'Land — Island Swamp',
  'sacred foundry': 'Land — Plains Mountain',
  'stomping ground': 'Land — Forest Mountain',
  'godless shrine': 'Land — Plains Swamp',
  'breeding pool': 'Land — Forest Island',
  'command tower': 'Land',
  'ancient tomb': 'Land',

  // Iconic spells used across the project's other mock data, for consistency
  'sol ring': 'Artifact',
  'lightning bolt': 'Instant',
  'rhystic study': 'Enchantment',
  'swords to plowshares': 'Instant',
  cultivate: 'Sorcery',
  counterspell: 'Instant',
  'demonic tutor': 'Sorcery',
  'wrath of god': 'Sorcery',
  "teferi's protection": 'Instant',
  'smothering tithe': 'Enchantment',
  'avenger of zendikar': 'Creature — Elemental',
  brainstorm: 'Instant',
  'path to exile': 'Instant',
  'toxic deluge': 'Sorcery',
  'mana drain': 'Instant',
  'birds of paradise': 'Creature — Bird',
  'vampiric tutor': 'Instant',
  skullclamp: 'Artifact — Equipment',
  fireblast: 'Instant',
};

export interface ResolvedCardType {
  name: string;
  typeLine: string | null; // null means "not in our lookup table yet"
}

export function lookupTypeLine(name: string): string | null {
  return KNOWN_CARD_TYPES[name.trim().toLowerCase()] ?? null;
}

export function resolveCardTypes(names: string[]): ResolvedCardType[] {
  return names.map((name) => ({ name, typeLine: lookupTypeLine(name) }));
}
