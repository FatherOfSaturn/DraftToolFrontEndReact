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
import { mockClassicGameApi } from './mockClassicGameApi';

// Classic Draft endpoints live under /classic-game and are completely
// separate from the pyramid /game API. Swapped in for the in-memory fake
// when VITE_USE_MOCK_API=true, exactly like gameApi.
const USE_MOCK = env.useMockGameApi;

const segment = encodeURIComponent;

const realClassicGameApi = {
  /** POST /classic-game */
  createClassicGame(request: ClassicCreateGameRequest): Promise<ClassicGameInfo> {
    return requestJson<ClassicGameInfo>('/classic-game', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /** POST /classic-game/{gameID}/player/{playerName}/draftCard/{cardID} */
  draftCard(gameID: string, playerName: string, cardID: string): Promise<Card> {
    return requestJson<Card>(
      `/classic-game/${segment(gameID)}/player/${segment(playerName)}/draftCard/${segment(cardID)}`,
      { method: 'POST' }
    );
  },

  /** GET /classic-game/{gameID}/player/{playerName}/draftCheck */
  draftCheck(gameID: string, playerName: string): Promise<ClassicDraftCheckResponse> {
    return requestJson<ClassicDraftCheckResponse>(
      `/classic-game/${segment(gameID)}/player/${segment(playerName)}/draftCheck`
    );
  },

  /** GET /classic-game/{gameID}/player/{playerName}/draftData */
  draftData(gameID: string, playerName: string): Promise<ClassicDraftDataResponse> {
    return requestJson<ClassicDraftDataResponse>(
      `/classic-game/${segment(gameID)}/player/${segment(playerName)}/draftData`
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
