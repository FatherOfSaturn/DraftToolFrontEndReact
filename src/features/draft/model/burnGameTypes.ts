import type { Card } from '../../../shared/model/cardTypes';
import type { DraftDirection } from './classicGameTypes';
import type { CardPack } from './gameTypes';

// These mirror the burn-draft backend DTOs under /burn-game (see the Burn
// Draft API spec). Keep field names in sync with the backend; do not rename
// without updating the Java side too.

export type BurnGameState = 'GAME_STARTED' | 'GAME_MERGED' | 'GAME_COMPLETE' | string;

export type BurnRemainderPolicy = 'BURN_EXTRAS' | 'DRAFT_EXTRAS';

export interface BurnPlayer {
  playerName: string;
  draftOrderNumber: number;
  cardsDrafted: Card[];
  cardsBurned: Card[];
  dealtCardPacks: CardPack[];
  activeCardPacks: CardPack[];
  accountID?: string;
}

/**
 * The per-player view returned by `draftData`. The backend always includes
 * `cardsLeftToDraft`; it stays optional here so `computeBurnCardsLeft`'s
 * defensive fallback (which derives it from `dealtCardPacks`) still
 * typechecks for minimal snapshots.
 */
export interface BurnPlayerSnapshot {
  playerName: string;
  activeCardPacks: CardPack[];
  cardsDrafted: Card[];
  cardsBurned: Card[];
  cardsLeftToDraft?: number;
  dealtCardPacks?: CardPack[];
}

export interface BurnGameInfo {
  gameID: string;
  cubeID: string;
  gameType: string;
  players: BurnPlayer[];
  gameState: BurnGameState;
  createdAt: string;
  currentPackIndex: number;
  draftDirection: DraftDirection;
  cardsDraftedPerPack: number;
  cardsBurnedPerPack: number;
  remainderPolicy: BurnRemainderPolicy;
}

export interface BurnDraftDataResponse {
  gameID: string;
  gameState: BurnGameState;
  draftDirection: DraftDirection;
  cardsDraftedPerPack: number;
  cardsBurnedPerPack: number;
  remainderPolicy: BurnRemainderPolicy;
  player: BurnPlayerSnapshot;
}

export interface BurnDraftCheckResponse {
  canDraft: boolean;
  gameState: BurnGameState;
}

/** Request values accept the lowercase aliases as well as the uppercase names. */
export type BurnRemainderPolicyInput = 'burn_extras' | 'draft_extras' | BurnRemainderPolicy;

export interface BurnCreateGameRequest {
  cubeID: string;
  players: { name: string; accountID?: string; playerToken?: string }[];
  numberOfPacks: number;
  cardsPerPack: number;
  packsPerPlayer: number;
  cardsDraftedPerPack: number;
  cardsBurnedPerPack: number;
  remainderPolicy?: BurnRemainderPolicyInput;
}

/** The cards chosen for a single turn. Must be disjoint, from the held pack. */
export interface BurnDraftRequest {
  draftCardIds: string[];
  burnCardIds: string[];
}

export interface BurnGameSummary {
  gameID: string;
  cubeID: string;
  gameState: BurnGameState;
  playerName: string;
  draftOrderNumber: number;
  cardsDraftedCount: number;
  cardsBurnedCount: number;
  totalPacks: number;
  currentPackIndex: number;
  createdAt: string;
}
