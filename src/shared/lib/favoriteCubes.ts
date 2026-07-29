export interface FavoriteCube {
  cubeID: string;
  name: string;
  description: string;
  /** Material icon name */
  icon: string;
}

export const FAVORITE_CUBES: FavoriteCube[] = [
  {
    cubeID: 'InnistradInspired',
    name: 'Innistrad Inspired Cube',
    description: 'My personal cube — My attempt at making a cube around the main spookies of innistrad.',
    icon: 'auto_stories',
  },
  {
    cubeID: '249fcebd-1794-4ce6-86b5-b5c4ae31c756',
    name: 'Legacy-Schmegacy',
    description: 'A vintage-powered cube with a focus on the most powerful cards in Magic\'s history.',
    icon: 'flash_on',
  },
  {
    cubeID: 'WaWa',
    name: 'WaWa\'s Cube (Vintage+Power)',
    description: 'This cube is intended to provide a variety of powerful draft decks for exciting games.',
    icon: 'shield',
  },
];
