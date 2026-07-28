// These mirror org.magic.accountService.api. Keep backend field names unchanged.
export interface Account {
  accountID: string;
  email: string;
  displayName: string;
  googleSub: string;
  deckIDs: string[];
  createdAt: string;
}

export interface Deck {
  deckID: string;
  accountID: string;
  name: string;
  description: string;
  cardIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type GameState = 'game_started' | 'game_merged' | 'game_complete';

export interface GameSummary {
  gameID: string;
  cubeID: string;
  gameState: GameState;
  player1Name: string;
  player2Name: string;
  player1CurrentPack: number;
  player1TotalPacks: number;
  player1DoneDrafting: boolean;
  player2CurrentPack: number;
  player2TotalPacks: number;
  player2DoneDrafting: boolean;
  createdAt: string;
}
