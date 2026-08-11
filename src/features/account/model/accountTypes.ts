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

export type GameState = 'game_created' | 'game_in_progress' | 'game_merged' | 'game_complete';

/**
 * One player's summary within a history entry. Mirrors the unified
 * `/account/game/history/{accountID}` DTO: every draft type returns the same
 * shape, so the Saved Drafts UI is type-agnostic. Fields that only some draft
 * types populate (cardsLeftToDraft, draftOrderNumber) are null for the others.
 */
export interface GameHistoryPlayer {
  name: string | null;
  displayName: string | null;
  accountID: string | null;
  currentPack: number;
  totalPacks: number;
  doneDrafting: boolean;
  cardsLeftToDraft: number | null;
  draftOrderNumber: number | null;
}

/**
 * A single draft across all game types, as returned by the centralized
 * history endpoint. gameState is already normalized to the shared GameState
 * enum by the backend. One entry per game (all players included), newest first.
 */
export interface GameHistoryEntry {
  gameID: string;
  cubeID: string;
  gameType: 'pyramid' | 'classic';
  gameState: GameState;
  players: GameHistoryPlayer[];
  createdAt: string;
}
