import type { Card } from '../../../shared/model/cardTypes';

// These mirror the existing Angular interfaces / Java DTOs exactly.
// Keep field names in sync with the backend; do not rename without
// updating org.magic.draft.api on the Java side too.

export interface CardPack {
  packNumber: number;
  cardsInPack: Card[];
  originalCardsInPack: number;
  doubleDraftedFlag: boolean;
}

export interface Player {
  playerName: string;
  accountID: string;
  cardPacks: CardPack[];
  cardsDrafted: Card[];
  doubleDraftPicksRemaining: number;
  currentDraftPack: number;
  readyForMerge: boolean;
}

export interface PlayerStart {
  accountID: string;
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
