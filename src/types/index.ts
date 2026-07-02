// These mirror the existing Angular interfaces / Java DTOs exactly.
// Keep field names in sync with the backend — do not rename without
// updating org.magic.draft.api on the Java side too.

export interface CardDetail {
  set: string;
  set_name: string;
  scryfall_id: string;
  image_small: string;
  image_normal: string;
  image_flip: string | null;
  name: string;
  parsed_cost: string[];
}

export interface Card {
  cardID: string;
  name: string;
  details: CardDetail;
  cmc: number;
  type_line: string;
  reveal: boolean;
}

export interface CardPack {
  packNumber: number;
  cardsInPack: Card[];
  originalCardsInPack: number;
  doubleDraftedFlag: boolean;
}

export interface Player {
  playerName: string;
  playerID: string;
  cardPacks: CardPack[];
  cardsDrafted: Card[];
  doubleDraftPicksRemaining: number;
  currentDraftPack: number;
  readyForMerge: boolean;
}

export interface PlayerStart {
  playerID: string;
  name: string;
}

export type GameState =
  | 'GAME_CREATED'
  | 'GAME_IN_PROGRESS'
  | 'GAME_MERGED'
  | 'GAME_COMPLETE'
  | string;

export interface GameInfo {
  gameID: string;
  players: Player[];
  gameState: GameState;
}

export interface GameCreationInfo {
  gameID: string;
  cubeID: string;
  numberOfDoubleDraftPicksPerPlayer: number;
  players: PlayerStart[];
}

export interface GameStatusMessage {
  gameID: string;
  gameState: GameState;
}
