import type { Card } from '../../../shared/model/cardTypes';
import { ApiError } from '../../../shared/api/httpClient';
import { getLobbyPlayerToken } from '../../../shared/api/sessionToken';
import type {
  BurnCreateGameRequest,
  BurnDraftCheckResponse,
  BurnDraftDataResponse,
  BurnDraftRequest,
  BurnGameInfo,
  BurnGameSummary,
  BurnPlayer,
  BurnRemainderPolicy,
} from '../model/burnGameTypes';
import type { DraftDirection } from '../model/classicGameTypes';
import type { CardPack } from '../model/gameTypes';
import { planTurn } from '../model/burnStats';
import { createRandomPack } from './mockGameApi';

/**
 * In-memory stand-in for the burn /burn-game backend, used when
 * VITE_USE_MOCK_API=true. Mirrors the burn spec's lifecycle:
 *
 *  1. createBurnGame deals `packsPerPlayer` packs per player into
 *     `dealtCardPacks` and immediately deals generation 0 into
 *     `activeCardPacks`.
 *  2. On a turn the player drafts N cards and burns M cards from
 *     activeCardPacks[0] (counts from `planTurn`), the remainder is passed to
 *     the next seat, and when every player is out of active packs the
 *     direction flips, currentPackIndex increments and the next generation is
 *     dealt. The last generation auto-completes the game.
 *
 * Like mockGameApi/mockClassicGameApi, this is a development aid, not a real
 * game engine.
 */

const MOCK_DELAY_MS = 350;

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;

interface StoredGame {
  info: BurnGameInfo;
}

const games = new Map<string, StoredGame>();

// Mirrors the real backend: player identity on draft calls comes from the
// caller's X-Player-Token. Maps gameID -> token -> playerName. In this mock
// (a single-client dev aid) the token at create time maps to the first seat.
const mockBurnTokens = new Map<string, Map<string, string>>();

function registerToken(gameID: string, playerName: string): void {
  const token = getLobbyPlayerToken();
  if (!token) return;
  const map = mockBurnTokens.get(gameID) ?? new Map<string, string>();
  map.set(token, playerName);
  mockBurnTokens.set(gameID, map);
}

function currentPlayerName(gameID: string): string {
  const token = getLobbyPlayerToken();
  const playerName = token ? mockBurnTokens.get(gameID)?.get(token) : undefined;
  if (!playerName) {
    throw new ApiError(401, 'GET', '/burn-game', 'Missing or unknown X-Player-Token');
  }
  return playerName;
}

let gameCounter = 0;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), MOCK_DELAY_MS));
}

function uuid(): string {
  gameCounter += 1;
  return `mock-burn-${gameCounter}-${Date.now()}`;
}

function normalizePolicy(policy: BurnCreateGameRequest['remainderPolicy']): BurnRemainderPolicy {
  return typeof policy === 'string' && policy.toLowerCase() === 'draft_extras'
    ? 'DRAFT_EXTRAS'
    : 'BURN_EXTRAS';
}

function makePack(packNumber: number, cardsPerPack: number): CardPack {
  return {
    packNumber,
    cardsInPack: createRandomPack(cardsPerPack),
    originalCardsInPack: cardsPerPack,
    doubleDraftedFlag: false,
  };
}

function validateCreateRequest(request: BurnCreateGameRequest): void {
  if (!request.cubeID || !Array.isArray(request.players)) {
    throw new ApiError(400, 'POST', '/burn-game', 'Invalid request: cubeID and players are required');
  }
  if (request.players.length < MIN_PLAYERS || request.players.length > MAX_PLAYERS) {
    throw new ApiError(
      400,
      'POST',
      '/burn-game',
      `Burn draft requires between ${MIN_PLAYERS} and ${MAX_PLAYERS} players`
    );
  }
  if (request.cardsPerPack < 1 || request.cardsPerPack > 25) {
    throw new ApiError(400, 'POST', '/burn-game', 'cardsPerPack must be between 1 and 25');
  }
  if (request.packsPerPlayer < 1 || request.packsPerPlayer > 30) {
    throw new ApiError(400, 'POST', '/burn-game', 'packsPerPlayer must be between 1 and 30');
  }
  if (request.cardsDraftedPerPack < 1) {
    throw new ApiError(400, 'POST', '/burn-game', 'cardsDraftedPerPack must be at least 1');
  }
  if (request.cardsBurnedPerPack < 0) {
    throw new ApiError(400, 'POST', '/burn-game', 'cardsBurnedPerPack cannot be negative');
  }
  if (request.cardsDraftedPerPack + request.cardsBurnedPerPack > request.cardsPerPack) {
    throw new ApiError(
      400,
      'POST',
      '/burn-game',
      'cardsDraftedPerPack + cardsBurnedPerPack must not exceed cardsPerPack'
    );
  }
  if (request.numberOfPacks !== request.players.length * request.packsPerPlayer) {
    throw new ApiError(400, 'POST', '/burn-game', 'numberOfPacks must equal players.length × packsPerPlayer');
  }
}

function findPlayer(info: BurnGameInfo, playerName: string): BurnPlayer {
  const player = info.players.find((p) => p.playerName === playerName);
  if (!player) {
    throw new ApiError(404, 'GET', '/burn-game', `Unknown player: ${playerName}`);
  }
  return player;
}

function findGame(gameID: string, method: string): BurnGameInfo {
  const stored = games.get(gameID);
  if (!stored) {
    throw new ApiError(404, method, '/burn-game', `Unknown game: ${gameID}`);
  }
  return stored.info;
}

function seatOf(player: BurnPlayer): number {
  return player.draftOrderNumber;
}

function nextSeat(info: BurnGameInfo, current: BurnPlayer, direction: DraftDirection): BurnPlayer {
  const total = info.players.length;
  const step = direction === 'ASCENDING' ? 1 : -1;
  const nextIndex = (seatOf(current) + step + total) % total;
  const next = info.players.find((p) => seatOf(p) === nextIndex);
  if (!next) throw new ApiError(500, 'POST', '/burn-game', 'Draft seat ordering is corrupt');
  return next;
}

function totalGenerations(info: BurnGameInfo): number {
  return info.players[0]?.dealtCardPacks.length ?? 0;
}

function dealNextGeneration(info: BurnGameInfo): void {
  info.currentPackIndex += 1;
  info.draftDirection = info.draftDirection === 'ASCENDING' ? 'DESCENDING' : 'ASCENDING';
  for (const player of info.players) {
    player.activeCardPacks = [player.dealtCardPacks[info.currentPackIndex]];
  }
}

export const mockBurnGameApi = {
  async createBurnGame(request: BurnCreateGameRequest): Promise<BurnGameInfo> {
    validateCreateRequest(request);

    const players: BurnPlayer[] = request.players.map((entry, index) => {
      const dealtCardPacks = Array.from({ length: request.packsPerPlayer }, (_, j) =>
        makePack(j, request.cardsPerPack)
      );
      return {
        playerName: entry.name,
        accountID: entry.accountID,
        draftOrderNumber: index,
        dealtCardPacks,
        activeCardPacks: [dealtCardPacks[0]],
        cardsDrafted: [],
        cardsBurned: [],
      };
    });

    const info: BurnGameInfo = {
      gameID: uuid(),
      cubeID: request.cubeID,
      gameType: 'burn',
      players,
      gameState: 'GAME_STARTED',
      createdAt: new Date().toISOString(),
      currentPackIndex: 0,
      draftDirection: 'ASCENDING',
      cardsDraftedPerPack: request.cardsDraftedPerPack,
      cardsBurnedPerPack: request.cardsBurnedPerPack,
      remainderPolicy: normalizePolicy(request.remainderPolicy),
    };

    games.set(info.gameID, { info });
    registerToken(info.gameID, info.players[0]?.playerName ?? '');
    return delay(info);
  },

  async draft(gameID: string, request: BurnDraftRequest): Promise<Card[]> {
    const info = findGame(gameID, 'POST');
    const player = findPlayer(info, currentPlayerName(gameID));

    if (player.activeCardPacks.length === 0) {
      throw new ApiError(409, 'POST', '/burn-game', 'Player has no pack to act on');
    }

    const pack = player.activeCardPacks[0];
    const plan = planTurn(
      pack.cardsInPack.length,
      info.cardsDraftedPerPack,
      info.cardsBurnedPerPack,
      info.remainderPolicy
    );

    const draftIds = request.draftCardIds ?? [];
    const burnIds = request.burnCardIds ?? [];

    if (draftIds.length !== plan.draft || burnIds.length !== plan.burn) {
      throw new ApiError(
        400,
        'POST',
        '/burn-game',
        `Expected ${plan.draft} drafted and ${plan.burn} burned cards this turn`
      );
    }

    const allIds = [...draftIds, ...burnIds];
    if (new Set(allIds).size !== allIds.length) {
      throw new ApiError(400, 'POST', '/burn-game', 'The same card cannot be drafted and burned');
    }

    const byId = new Map(pack.cardsInPack.map((c) => [c.cardID, c]));
    const drafted: Card[] = [];
    const burned: Card[] = [];
    for (const id of draftIds) {
      const found = byId.get(id);
      if (!found) throw new ApiError(400, 'POST', '/burn-game', `Card ${id} is not in the held pack`);
      drafted.push(found);
    }
    for (const id of burnIds) {
      const found = byId.get(id);
      if (!found) throw new ApiError(400, 'POST', '/burn-game', `Card ${id} is not in the held pack`);
      burned.push(found);
    }

    const removed = new Set(allIds);
    pack.cardsInPack = pack.cardsInPack.filter((c) => !removed.has(c.cardID));
    player.cardsDrafted.push(...drafted);
    player.cardsBurned.push(...burned);

    const exhausted = pack.cardsInPack.length === 0;
    if (player.activeCardPacks.length > 0) {
      player.activeCardPacks.shift();
    }
    if (!exhausted) {
      nextSeat(info, player, info.draftDirection).activeCardPacks.push(pack);
    }

    if (info.players.every((p) => p.activeCardPacks.length === 0)) {
      if (info.currentPackIndex + 1 < totalGenerations(info)) {
        dealNextGeneration(info);
      } else {
        info.gameState = 'GAME_COMPLETE';
      }
    }

    return delay(drafted);
  },

  async draftCheck(gameID: string): Promise<BurnDraftCheckResponse> {
    const info = findGame(gameID, 'GET');
    const player = findPlayer(info, currentPlayerName(gameID));
    return delay({
      canDraft: player.activeCardPacks.length > 0 && info.gameState === 'GAME_STARTED',
      gameState: info.gameState,
    });
  },

  async draftData(gameID: string): Promise<BurnDraftDataResponse> {
    const info = findGame(gameID, 'GET');
    const player = findPlayer(info, currentPlayerName(gameID));
    return delay({
      gameID,
      gameState: info.gameState,
      draftDirection: info.draftDirection,
      cardsDraftedPerPack: info.cardsDraftedPerPack,
      cardsBurnedPerPack: info.cardsBurnedPerPack,
      remainderPolicy: info.remainderPolicy,
      player: {
        ...player,
        cardsLeftToDraft:
          player.dealtCardPacks.length * (player.dealtCardPacks[0]?.originalCardsInPack ?? 0) -
          player.cardsDrafted.length -
          player.cardsBurned.length,
      },
    });
  },

  async fetchGameData(gameID: string): Promise<BurnGameInfo> {
    const info = findGame(gameID, 'GET');
    if (info.gameState !== 'GAME_COMPLETE') {
      throw new ApiError(
        409,
        'GET',
        '/burn-game',
        'Game data is only available once the draft is complete'
      );
    }
    return delay(info);
  },

  async endGame(gameID: string): Promise<{ gameID: string; gameState: string }> {
    const info = findGame(gameID, 'POST');
    info.gameState = 'GAME_COMPLETE';
    return delay({ gameID, gameState: info.gameState });
  },

  async history(playerName: string): Promise<BurnGameSummary[]> {
    const summaries: BurnGameSummary[] = [];
    for (const { info } of games.values()) {
      const player = info.players.find((p) => p.playerName === playerName);
      if (!player) continue;
      summaries.push({
        gameID: info.gameID,
        cubeID: info.cubeID,
        gameState: info.gameState,
        playerName: player.playerName,
        draftOrderNumber: player.draftOrderNumber,
        cardsDraftedCount: player.cardsDrafted.length,
        cardsBurnedCount: player.cardsBurned.length,
        totalPacks: player.dealtCardPacks.length,
        currentPackIndex: info.currentPackIndex,
        createdAt: info.createdAt,
      });
    }
    summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return delay(summaries);
  },
};
