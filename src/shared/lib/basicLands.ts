import type { ArtFrameKey } from './placeholderArt';

export interface BasicLandDefinition {
  name: 'Plains' | 'Island' | 'Swamp' | 'Mountain' | 'Forest';
  symbol: ArtFrameKey;
  manaClass: string;
  imageUrl: string;
}

export const BASIC_LANDS: BasicLandDefinition[] = [
  { name: 'Plains', symbol: 'W', manaClass: 'mana-white', imageUrl: 'https://cards.scryfall.io/normal/front/2/1/21a8b83f-b7c8-4a8b-9c5c-31c793c6d9f0.jpg?1783943880' },
  { name: 'Island', symbol: 'U', manaClass: 'mana-blue', imageUrl: 'https://cards.scryfall.io/normal/front/8/0/80b3c994-e943-406d-a02d-d7cc4ebc6bba.jpg?1783920248' },
  { name: 'Swamp', symbol: 'B', manaClass: 'mana-black', imageUrl: 'https://cards.scryfall.io/normal/front/7/5/75ac1b9a-d919-4b4e-b80a-635de721fb67.jpg?1783938027' },
  { name: 'Mountain', symbol: 'R', manaClass: 'mana-red', imageUrl: 'https://cards.scryfall.io/normal/front/b/1/b137c4c5-9091-4130-ba83-87a28435c9e8.jpg?1783934665' },
  { name: 'Forest', symbol: 'G', manaClass: 'mana-green', imageUrl: 'https://cards.scryfall.io/normal/front/e/a/ea556a69-c487-45ca-8f60-7e89407ec7b7.jpg?1783930483' },
];

export const BASIC_LAND_FRAME: Record<string, ArtFrameKey> = Object.fromEntries(
  BASIC_LANDS.map((land) => [land.name, land.symbol])
);
