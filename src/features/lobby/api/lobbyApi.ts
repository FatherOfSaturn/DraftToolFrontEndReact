import type { LobbyInfo, CreateLobbyRequest, JoinLobbyResponse, LeaveLobbyRequest, JoinLobbyRequest, KickPlayerRequest, StartGameRequest } from '../model/lobbyTypes';
import { env } from '../../../config/env';
import { requestJson } from '../../../shared/api/httpClient';
import { mockLobbyApi } from './mockLobbyApi';

const USE_MOCK = env.useMockGameApi;

const segment = encodeURIComponent;

function normalizeLobbyInfo(lobby: LobbyInfo): LobbyInfo {
  return {
    ...lobby,
    status: lobby.status.toLowerCase() as LobbyInfo['status'],
    draftType: lobby.draftType.toLowerCase() as LobbyInfo['draftType'],
  };
}

const realLobbyApi = {
  /** POST /lobby — returns the lobby plus the host's own playerToken (201). */
  createLobby(req: CreateLobbyRequest): Promise<JoinLobbyResponse> {
    return requestJson<JoinLobbyResponse>('/lobby', {
      method: 'POST',
      body: JSON.stringify(req),
    }).then((res) => ({ ...res, lobby: normalizeLobbyInfo(res.lobby) }));
  },

  joinLobby(
    lobbyCode: string,
    accountID: string | null,
    displayName: string
  ): Promise<JoinLobbyResponse> {
    const body: JoinLobbyRequest = { accountID, displayName };
    return requestJson<JoinLobbyResponse>(`/lobby/${segment(lobbyCode)}/join`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((res) => ({ ...res, lobby: normalizeLobbyInfo(res.lobby) }));
  },

  leaveLobby(lobbyCode: string, playerToken: string): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerToken } satisfies LeaveLobbyRequest),
    }).then(normalizeLobbyInfo);
  },

  kickPlayer(
    lobbyCode: string,
    playerToken: string,
    targetSlotIndex: number
  ): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}/kick`, {
      method: 'POST',
      body: JSON.stringify({ playerToken, targetSlotIndex } satisfies KickPlayerRequest),
    }).then(normalizeLobbyInfo);
  },

  pollLobby(lobbyCode: string, playerToken?: string): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}`, {
      headers: playerToken ? { 'X-Player-Token': playerToken } : undefined,
    }).then(normalizeLobbyInfo);
  },

  startLobby(lobbyCode: string, playerToken: string): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}/start`, {
      method: 'POST',
      body: JSON.stringify({ playerToken } satisfies StartGameRequest),
    }).then(normalizeLobbyInfo);
  },
};

export const lobbyApi = USE_MOCK ? mockLobbyApi : realLobbyApi;
