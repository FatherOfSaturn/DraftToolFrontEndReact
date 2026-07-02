import type {
  Card,
  GameCreationInfo,
  GameInfo,
  GameStatusMessage,
} from '../types';
import { mockGameApi } from './mockGameApi';

// Point this at your Quarkus backend. Override at build time with
// VITE_API_BASE_URL if it's not running on localhost:8080.
const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

// Set VITE_USE_MOCK_API=true in your .env to run the whole frontend
// against an in-memory fake backend — no Java server required. Every
// page (Home, Setup, Draft board) works identically either way, since
// they only ever call the gameApi object below, never fetch() directly.
const USE_MOCK = import.meta.env?.VITE_USE_MOCK_API === 'true';

if (USE_MOCK && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '%c[mock-api] VITE_USE_MOCK_API=true — using in-memory fake backend, no real network calls will be made.',
    'color: #d4a843; font-weight: bold;'
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`);
  }

  // GET /game/merge and /game/end can return null when the game
  // isn't ready yet — guard against an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const realGameApi = {
  /** POST /game */
  createAndStartGame(gameInfo: GameCreationInfo): Promise<GameInfo> {
    return request<GameInfo>('/game', {
      method: 'POST',
      body: JSON.stringify(gameInfo),
    });
  },

  /** GET /game/fetchGameData/{gameID} */
  fetchGameData(gameID: string): Promise<GameInfo> {
    return request<GameInfo>(`/game/fetchGameData/${gameID}`);
  },

  /** POST /game/{gameID}/{playerID}/draftCard/{packNumber}/{cardID}?doublePick= */
  draftCard(
    gameID: string,
    playerID: string,
    packNumber: number,
    cardID: string,
    doublePick: boolean
  ): Promise<Card> {
    return request<Card>(
      `/game/${gameID}/${playerID}/draftCard/${packNumber}/${encodeURIComponent(cardID)}?doublePick=${doublePick}`,
      { method: 'POST' }
    );
  },

  /** GET /game/merge/{gameID} — null if not ready yet */
  triggerPackMergeAndSwap(gameID: string): Promise<GameStatusMessage | null> {
    return request<GameStatusMessage | null>(`/game/merge/${gameID}`);
  },

  /** GET /game/end/{gameID} — null if not ready yet */
  endGame(gameID: string): Promise<GameStatusMessage | null> {
    return request<GameStatusMessage | null>(`/game/end/${gameID}`);
  },

  /** DELETE /game/end/admin/delete/random/{gameState} */
  deleteGamesWithStatus(gameState: string): Promise<void> {
    return request<void>(`/game/end/admin/delete/random/${gameState}`, {
      method: 'DELETE',
    });
  },
};

export const gameApi = USE_MOCK ? mockGameApi : realGameApi;
