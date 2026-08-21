import type { Card } from '../../../shared/model/cardTypes';
import type {
  ClassicCreateGameRequest,
  ClassicDraftCheckResponse,
  ClassicDraftDataResponse,
  ClassicGameInfo,
  ClassicGameSummary,
} from '../model/classicGameTypes';
import { env } from '../../../config/env';
import { requestJson } from '../../../shared/api/httpClient';
import { getLobbyPlayerToken } from '../../../shared/api/sessionToken';
import { mockClassicGameApi } from './mockClassicGameApi';

// Classic Draft endpoints live under /classic-game and are completely
// separate from the pyramid /game API. Swapped in for the in-memory fake
// when VITE_USE_MOCK_API=true, exactly like gameApi.
const USE_MOCK = env.useMockGameApi;

const segment = encodeURIComponent;

function playerTokenHeader(): Record<string, string> {
  const token = getLobbyPlayerToken();
  return token ? { 'X-Player-Token': token } : {};
}

const realClassicGameApi = {
  /** POST /classic-game */
  createClassicGame(request: ClassicCreateGameRequest): Promise<ClassicGameInfo> {
    return requestJson<ClassicGameInfo>('/classic-game', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /** POST /classic-game/{gameID}/draftCard/{cardID} — player identity via X-Player-Token */
  draftCard(gameID: string, cardID: string): Promise<Card> {
    return requestJson<Card>(
      `/classic-game/${segment(gameID)}/draftCard/${segment(cardID)}`,
      { method: 'POST', headers: playerTokenHeader() }
    );
  },

  /** GET /classic-game/{gameID}/draftCheck — player identity via X-Player-Token */
  draftCheck(gameID: string): Promise<ClassicDraftCheckResponse> {
    return requestJson<ClassicDraftCheckResponse>(
      `/classic-game/${segment(gameID)}/draftCheck`,
      { headers: playerTokenHeader() }
    );
  },

  /** GET /classic-game/{gameID}/draftData — player identity via X-Player-Token */
  draftData(gameID: string): Promise<ClassicDraftDataResponse> {
    return requestJson<ClassicDraftDataResponse>(
      `/classic-game/${segment(gameID)}/draftData`,
      { headers: playerTokenHeader() }
    );
  },

  /** GET /classic-game/fetchGameData/{gameID} — only returns data once GAME_COMPLETE (409 before that). */
  fetchGameData(gameID: string): Promise<ClassicGameInfo> {
    return requestJson<ClassicGameInfo>(`/classic-game/fetchGameData/${segment(gameID)}`);
  },

  /** POST /classic-game/end/{gameID} */
  endGame(gameID: string): Promise<{ gameID: string; gameState: string }> {
    return requestJson<{ gameID: string; gameState: string }>(`/classic-game/end/${segment(gameID)}`, {
      method: 'POST',
    });
  },

  /** GET /classic-game/history/{playerName} */
  history(playerName: string): Promise<ClassicGameSummary[]> {
    return requestJson<ClassicGameSummary[]>(`/classic-game/history/${segment(playerName)}`);
  },
};

export const classicGameApi = USE_MOCK ? mockClassicGameApi : realClassicGameApi;
