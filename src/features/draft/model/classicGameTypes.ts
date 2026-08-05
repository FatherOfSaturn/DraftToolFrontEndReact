import type { Card } from '../../../shared/model/cardTypes';
import type { CardPack } from './gameTypes';

// These mirror the classic-draft backend DTOs under /classic-game (see the
// Classic Draft API spec). Keep field names in sync with the backend; do not
// rename without updating the Java side too.

export type ClassicGameState = 'GAME_STARTED' | 'GAME_COMPLETE' | string;

export type DraftDirection = 'ASCENDING' | 'DESCENDING';

export interface ClassicPlayer {
  playerName: string;
  accountID: string;
  draftOrderNumber: number;
  dealtCardPacks: CardPack[];
  activeCardPacks: CardPack[];
  cardsDrafted: Card[];
}

export interface ClassicGameInfo {
  gameID: string;
  cubeID: string;
  gameType: string;
  players: ClassicPlayer[];
  gameState: ClassicGameState;
  createdAt: string;
  currentPackIndex: number;
  draftDirection: DraftDirection;
}

export interface ClassicDraftDataResponse {
  gameID: string;
  gameState: ClassicGameState;
  draftDirection: DraftDirection;
  player: ClassicPlayer;
}

export interface ClassicDraftCheckResponse {
  canDraft: boolean;
  gameState: ClassicGameState;
}

export interface ClassicCreateGameRequest {
  cubeID: string;
  players: { name: string; accountID: string }[];
  numberOfPacks: number;
  cardsPerPack: number;
  packsPerPlayer: number;
}

export interface ClassicGameSummary {
  gameID: string;
  cubeID: string;
  gameState: ClassicGameState;
  playerName: string;
  draftOrderNumber: number;
  cardsDraftedCount: number;
  totalPacks: number;
  currentPackIndex: number;
  createdAt: string;
}
