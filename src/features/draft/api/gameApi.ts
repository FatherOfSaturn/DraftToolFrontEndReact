import type { Card } from '../../../shared/model/cardTypes';
import type { GameCreationInfo, GameInfo, GameStatusMessage } from '../model/gameTypes';
import { env } from '../../../config/env';
import { requestJson, requestVoid } from '../../../shared/api/httpClient';
import { getLobbyPlayerToken } from '../../../shared/api/sessionToken';
import { mockGameApi } from './mockGameApi';

// Set VITE_USE_MOCK_API=true in your .env to run the whole frontend
// against an in-memory fake backend — no Java server required. Every
// page (Home, Setup, Draft board) works identically either way, since
// they only ever call the gameApi object below, never fetch() directly.
const USE_MOCK = env.useMockGameApi;

if (USE_MOCK && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '%c[mock-api] VITE_USE_MOCK_API=true — using in-memory fake backend, no real network calls will be made.',
    'color: #d4a843; font-weight: bold;'
  );
}

const segment = encodeURIComponent;

function playerTokenHeader(): Record<string, string> {
  const token = getLobbyPlayerToken();
  return token ? { 'X-Player-Token': token } : {};
}

const realGameApi = {
  /** POST /game */
  createAndStartGame(gameInfo: GameCreationInfo): Promise<GameInfo> {
    return requestJson<GameInfo>('/game', {
      method: 'POST',
      body: JSON.stringify(gameInfo),
    });
  },

  /** GET /game/fetchGameData/{gameID} */
  fetchGameData(gameID: string): Promise<GameInfo> {
    return requestJson<GameInfo>(`/game/fetchGameData/${segment(gameID)}`, {
      headers: playerTokenHeader(),
    });
  },

  /** POST /game/{gameID}/draftCard/{packNumber}/{cardID}?doublePick= — player identity via X-Player-Token */
  draftCard(
    gameID: string,
    packNumber: number,
    cardID: string,
    doublePick: boolean
  ): Promise<Card> {
    return requestJson<Card>(
      `/game/${segment(gameID)}/draftCard/${packNumber}/${segment(cardID)}?doublePick=${doublePick}`,
      { method: 'POST', headers: playerTokenHeader() }
    );
  },

  /** GET /game/merge/{gameID} — null if not ready yet */
  triggerPackMergeAndSwap(gameID: string): Promise<GameStatusMessage | null> {
    return requestJson<GameStatusMessage | null>(`/game/merge/${segment(gameID)}`);
  },

  /** GET /game/end/{gameID} — null if not ready yet */
  endGame(gameID: string): Promise<GameStatusMessage | null> {
    return requestJson<GameStatusMessage | null>(`/game/end/${segment(gameID)}`);
  },

  /** DELETE /game/end/admin/delete/{gameID} */
  deleteGame(gameID: string): Promise<void> {
    return requestVoid(`/game/end/admin/delete/${segment(gameID)}`, {
      method: 'DELETE',
    });
  },
};

export const gameApi = USE_MOCK ? mockGameApi : realGameApi;
