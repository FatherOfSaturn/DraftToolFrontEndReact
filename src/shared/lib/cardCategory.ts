export type CardCategory =
  | 'Land'
  | 'Creature'
  | 'Instant'
  | 'Sorcery'
  | 'Artifact'
  | 'Enchantment'
  | 'Planeswalker'
  | 'Battle'
  | 'Unknown';

const CATEGORY_KEYWORDS: [CardCategory, string][] = [
  ['Land', 'land'],
  ['Creature', 'creature'],
  ['Instant', 'instant'],
  ['Sorcery', 'sorcery'],
  ['Planeswalker', 'planeswalker'],
  ['Battle', 'battle'],
  ['Artifact', 'artifact'],
  ['Enchantment', 'enchantment'],
];

/**
 * A card can technically have multiple types (e.g. "Artifact Creature —
 * Construct"), but for deck-probability purposes we pick the single most
 * relevant category using this priority order: Land and Creature first
 * (the two things players ask "did I draw one" about most), then the
 * other types, since those combinations are rarer and the alternative
 * (double-counting a card in two categories) would make the density bars
 * sum to over 100%, which is confusing.
 */
const CATEGORY_PRIORITY: CardCategory[] = [
  'Land',
  'Creature',
  'Planeswalker',
  'Battle',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
];

export function categorizeTypeLine(typeLine: string | null): CardCategory {
  if (!typeLine) return 'Unknown';
  const lower = typeLine.toLowerCase();

  const matches = CATEGORY_KEYWORDS.filter(([, keyword]) => lower.includes(keyword)).map(
    ([category]) => category
  );

  if (matches.length === 0) return 'Unknown';

  for (const category of CATEGORY_PRIORITY) {
    if (matches.includes(category)) return category;
  }
  return matches[0];
}
