import type { ArtFrameKey } from './placeholderArt';

export interface BasicLandDefinition {
  name: 'Plains' | 'Island' | 'Swamp' | 'Mountain' | 'Forest';
  /**
   * WUBRG symbol shown on the Quick Add Land button. This is the same
   * value as the card's placeholder-art frame key, since a basic land's
   * color identity and its art tint are the same thing.
   */
  symbol: ArtFrameKey;
  /** CSS class from styles/stitch.css (.mana-white/.mana-blue/etc). */
  manaClass: string;
}

/**
 * The five basic lands, in WUBRG order. Single source of truth for two
 * previously-separate, hand-kept-in-sync lists:
 *  - PoolSidebar's Quick Add Land buttons (name + manaClass + symbol)
 *  - DeckBuilderPage's name -> ArtFrameKey map, used when building a
 *    basic land Card via importDecklist.ts's `buildCard`
 */
export const BASIC_LANDS: BasicLandDefinition[] = [
  { name: 'Plains', symbol: 'W', manaClass: 'mana-white' },
  { name: 'Island', symbol: 'U', manaClass: 'mana-blue' },
  { name: 'Swamp', symbol: 'B', manaClass: 'mana-black' },
  { name: 'Mountain', symbol: 'R', manaClass: 'mana-red' },
  { name: 'Forest', symbol: 'G', manaClass: 'mana-green' },
];

/** Basic land name -> ArtFrameKey, derived from BASIC_LANDS above. */
export const BASIC_LAND_FRAME: Record<string, ArtFrameKey> = Object.fromEntries(
  BASIC_LANDS.map((land) => [land.name, land.symbol])
);
