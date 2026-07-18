export interface FavoriteCube {
  cubeID: string;
  name: string;
  description: string;
  /** Material icon name */
  icon: string;
}

export const FAVORITE_CUBES: FavoriteCube[] = [
  {
    cubeID: 'pyramid-draft-cube',
    name: 'Pyramid Draft Cube',
    description: 'My personal cube — built around 2-player pyramid draft with high synergy and interactive gameplay.',
    icon: 'auto_stories',
  },
  {
    cubeID: 'arcane-vintage-303',
    name: 'Arcane Vintage',
    description: 'A vintage-powered cube with a focus on spell-based strategies and explosive openings.',
    icon: 'flash_on',
  },
  {
    cubeID: 'peasant-rebellion',
    name: 'Peasant Rebellion',
    description: 'commons and uncommons only — proving you don\'t need rares to draft a deep, skill-testing format.',
    icon: 'shield',
  },
];
