import type { Card } from '../../../shared/model/cardTypes';
import { ApiError } from '../../../shared/api/httpClient';
import { getLobbyPlayerToken } from '../../../shared/api/sessionToken';
import type {
  ClassicCreateGameRequest,
  ClassicDraftCheckResponse,
  ClassicDraftDataResponse,
  ClassicGameInfo,
  ClassicGameSummary,
  ClassicPlayer,
  DraftDirection,
} from '../model/classicGameTypes';
import type { CardPack } from '../model/gameTypes';
import { createRandomPack } from './mockGameApi';

/**
 * In-memory stand-in for the classic /classic-game backend, used when
 * VITE_USE_MOCK_API=true. Mirrors the classic spec's lifecycle:
 *
 *  1. createClassicGame deals `packsPerPlayer` packs per player into
 *     `dealtCardPacks` and immediately deals generation 0 into
 *     `activeCardPacks`.
 *  2. draftCard takes a card from activeCardPacks[0], passes the remainder
 *     to the next seat, and when every player is out of active packs flips
 *     the direction, increments currentPackIndex, and deals the next
 *     generation. The last generation auto-completes the game.
 *
 * Like mockGameApi, this is a development aid, not a real game engine.
 */

const MOCK_DELAY_MS = 350;

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 12;

interface StoredGame {
  info: ClassicGameInfo;
}

const games = new Map<string, StoredGame>();

// Mirrors the real backend: player identity on draft calls comes from the
// caller's X-Player-Token. Maps gameID -> token -> playerName. In this mock
// (a single-client dev aid) the token at create time maps to the first seat.
const mockClassicTokens = new Map<string, Map<string, string>>();

function registerToken(gameID: string, playerName: string): void {
  const token = getLobbyPlayerToken();
  if (!token) return;
  const map = mockClassicTokens.get(gameID) ?? new Map<string, string>();
  map.set(token, playerName);
  mockClassicTokens.set(gameID, map);
}

function currentPlayerName(gameID: string): string {
  const token = getLobbyPlayerToken();
  const playerName = token ? mockClassicTokens.get(gameID)?.get(token) : undefined;
  if (!playerName) {
    throw new ApiError(401, 'GET', '/classic-game', 'Missing or unknown X-Player-Token');
  }
  return playerName;
}

let gameCounter = 0;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), MOCK_DELAY_MS));
}

function uuid(): string {
  gameCounter += 1;
  return `mock-classic-${gameCounter}-${Date.now()}`;
}

function makePack(packNumber: number, cardsPerPack: number): CardPack {
  return {
    packNumber,
    cardsInPack: createRandomPack(cardsPerPack),
    originalCardsInPack: cardsPerPack,
    doubleDraftedFlag: false,
  };
}

function validateCreateRequest(request: ClassicCreateGameRequest): void {
  if (!request.cubeID || !Array.isArray(request.players)) {
    throw new ApiError(400, 'POST', '/classic-game', 'Invalid request: cubeID and players are required');
  }
  if (request.players.length < MIN_PLAYERS || request.players.length > MAX_PLAYERS) {
    throw new ApiError(
      400,
      'POST',
      '/classic-game',
      `Classic draft requires between ${MIN_PLAYERS} and ${MAX_PLAYERS} players`
    );
  }
  if (request.cardsPerPack < request.players.length || request.cardsPerPack > 25) {
    throw new ApiError(400, 'POST', '/classic-game', 'cardsPerPack must be between player count and 25');
  }
  if (request.numberOfPacks !== request.players.length * request.packsPerPlayer) {
    throw new ApiError(400, 'POST', '/classic-game', 'numberOfPacks must equal players.length × packsPerPlayer');
  }
}

function findPlayer(info: ClassicGameInfo, playerName: string): ClassicPlayer {
  const player = info.players.find((p) => p.playerName === playerName);
  if (!player) {
    throw new ApiError(404, 'GET', '/classic-game', `Unknown player: ${playerName}`);
  }
  return player;
}

function findGame(gameID: string, method: string): ClassicGameInfo {
  const stored = games.get(gameID);
  if (!stored) {
    throw new ApiError(404, method, '/classic-game', `Unknown game: ${gameID}`);
  }
  return stored.info;
}

function seatOf(player: ClassicPlayer): number {
  return player.draftOrderNumber;
}

function nextSeat(info: ClassicGameInfo, current: ClassicPlayer, direction: DraftDirection): ClassicPlayer {
  const total = info.players.length;
  const step = direction === 'ASCENDING' ? 1 : -1;
  const nextIndex = (seatOf(current) + step + total) % total;
  const next = info.players.find((p) => seatOf(p) === nextIndex);
  if (!next) throw new ApiError(500, 'POST', '/classic-game', 'Draft seat ordering is corrupt');
  return next;
}

function totalGenerations(info: ClassicGameInfo): number {
  // Every generation deals one pack per player, so generations = packsPerPlayer.
  return info.players[0]?.dealtCardPacks.length ?? 0;
}

function dealNextGeneration(info: ClassicGameInfo): void {
  info.currentPackIndex += 1;
  info.draftDirection = info.draftDirection === 'ASCENDING' ? 'DESCENDING' : 'ASCENDING';
  for (const player of info.players) {
    player.activeCardPacks = [player.dealtCardPacks[info.currentPackIndex]];
  }
}

export const mockClassicGameApi = {
  async createClassicGame(request: ClassicCreateGameRequest): Promise<ClassicGameInfo> {
    validateCreateRequest(request);

    const players: ClassicPlayer[] = request.players.map((entry, index) => {
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
      };
    });

    const info: ClassicGameInfo = {
      gameID: uuid(),
      cubeID: request.cubeID,
      gameType: 'classic',
      players,
      gameState: 'GAME_STARTED',
      createdAt: new Date().toISOString(),
      currentPackIndex: 0,
      draftDirection: 'ASCENDING',
    };

    games.set(info.gameID, { info });
    registerToken(info.gameID, info.players[0]?.playerName ?? '');
    return delay(info);
  },

  async draftCard(gameID: string, cardID: string): Promise<Card> {
    const info = findGame(gameID, 'POST');
    const player = findPlayer(info, currentPlayerName(gameID));

    if (player.activeCardPacks.length === 0) {
      throw new ApiError(400, 'POST', '/classic-game', `Player has no pack to draft from`);
    }

    const pack = player.activeCardPacks[0];
    const drafted = pack.cardsInPack.find((c) => c.cardID === cardID);
    if (!drafted) {
      throw new ApiError(400, 'POST', '/classic-game', `Card ${cardID} is not in the front pack`);
    }

    pack.cardsInPack = pack.cardsInPack.filter((c) => c.cardID !== cardID);
    player.cardsDrafted.push(drafted);

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

  async draftCheck(gameID: string): Promise<ClassicDraftCheckResponse> {
    const info = findGame(gameID, 'GET');
    const player = findPlayer(info, currentPlayerName(gameID));
    return delay({ canDraft: player.activeCardPacks.length > 0, gameState: info.gameState });
  },

  async draftData(gameID: string): Promise<ClassicDraftDataResponse> {
    const info = findGame(gameID, 'GET');
    const player = findPlayer(info, currentPlayerName(gameID));
    return delay({
      gameID,
      gameState: info.gameState,
      draftDirection: info.draftDirection,
      player: {
        ...player,
        cardsLeftToDraft:
          player.dealtCardPacks.length * (player.dealtCardPacks[0]?.originalCardsInPack ?? 0) -
          player.cardsDrafted.length,
      },
    });
  },

  async fetchGameData(gameID: string): Promise<ClassicGameInfo> {
    const info = findGame(gameID, 'GET');
    if (info.gameState !== 'GAME_COMPLETE') {
      throw new ApiError(
        409,
        'GET',
        '/classic-game',
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

  async history(playerName: string): Promise<ClassicGameSummary[]> {
    const summaries: ClassicGameSummary[] = [];
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
        totalPacks: player.dealtCardPacks.length,
        currentPackIndex: info.currentPackIndex,
        createdAt: info.createdAt,
      });
    }
    summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return delay(summaries);
  },
};
