import type { Card } from '../../../shared/model/cardTypes';
import type {
  BurnCreateGameRequest,
  BurnDraftCheckResponse,
  BurnDraftDataResponse,
  BurnDraftRequest,
  BurnGameInfo,
  BurnGameSummary,
} from '../model/burnGameTypes';
import { env } from '../../../config/env';
import { requestJson } from '../../../shared/api/httpClient';
import { getLobbyPlayerToken } from '../../../shared/api/sessionToken';
import { mockBurnGameApi } from './mockBurnGameApi';

// Burn Draft endpoints live under /burn-game, completely separate from the
// pyramid /game and classic /classic-game APIs. Swapped in for the in-memory
// fake when VITE_USE_MOCK_API=true, exactly like classicGameApi.
const USE_MOCK = env.useMockGameApi;

const segment = encodeURIComponent;

function playerTokenHeader(): Record<string, string> {
  const token = getLobbyPlayerToken();
  return token ? { 'X-Player-Token': token } : {};
}

const realBurnGameApi = {
  /** POST /burn-game */
  createBurnGame(request: BurnCreateGameRequest): Promise<BurnGameInfo> {
    return requestJson<BurnGameInfo>('/burn-game', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /** POST /burn-game/{gameID}/draft — draft + burn lists committed together. */
  draft(gameID: string, request: BurnDraftRequest): Promise<Card[]> {
    return requestJson<Card[]>(`/burn-game/${segment(gameID)}/draft`, {
      method: 'POST',
      headers: playerTokenHeader(),
      body: JSON.stringify(request),
    });
  },

  /** GET /burn-game/{gameID}/draftCheck — player identity via X-Player-Token */
  draftCheck(gameID: string): Promise<BurnDraftCheckResponse> {
    return requestJson<BurnDraftCheckResponse>(`/burn-game/${segment(gameID)}/draftCheck`, {
      headers: playerTokenHeader(),
    });
  },

  /** GET /burn-game/{gameID}/draftData — player identity via X-Player-Token */
  draftData(gameID: string): Promise<BurnDraftDataResponse> {
    return requestJson<BurnDraftDataResponse>(`/burn-game/${segment(gameID)}/draftData`, {
      headers: playerTokenHeader(),
    });
  },

  /** GET /burn-game/fetchGameData/{gameID} — only available once GAME_COMPLETE (409 before). */
  fetchGameData(gameID: string): Promise<BurnGameInfo> {
    return requestJson<BurnGameInfo>(`/burn-game/fetchGameData/${segment(gameID)}`);
  },

  /** POST /burn-game/end/{gameID} */
  endGame(gameID: string): Promise<{ gameID: string; gameState: string }> {
    return requestJson<{ gameID: string; gameState: string }>(`/burn-game/end/${segment(gameID)}`, {
      method: 'POST',
    });
  },

  /** GET /burn-game/history/{playerName} */
  history(playerName: string): Promise<BurnGameSummary[]> {
    return requestJson<BurnGameSummary[]>(`/burn-game/history/${segment(playerName)}`);
  },
};

export const burnGameApi = USE_MOCK ? mockBurnGameApi : realBurnGameApi;
