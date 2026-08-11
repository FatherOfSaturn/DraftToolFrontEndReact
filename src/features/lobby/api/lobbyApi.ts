import type { LobbyInfo, CreateLobbyRequest, JoinLobbyResponse, LeaveLobbyRequest, JoinLobbyRequest, KickPlayerRequest } from '../model/lobbyTypes';
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
  createLobby(req: CreateLobbyRequest): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>('/lobby', {
      method: 'POST',
      body: JSON.stringify(req),
    }).then(normalizeLobbyInfo);
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

  leaveLobby(
    lobbyCode: string,
    accountID: string | null,
    playerToken: string | null
  ): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}/leave`, {
      method: 'POST',
      body: JSON.stringify({ accountID, playerToken } satisfies LeaveLobbyRequest),
    }).then(normalizeLobbyInfo);
  },

  kickPlayer(
    lobbyCode: string,
    hostAccountID: string,
    playerToken: string
  ): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}/kick`, {
      method: 'POST',
      body: JSON.stringify({ hostAccountID, playerToken } satisfies KickPlayerRequest),
    }).then(normalizeLobbyInfo);
  },

  pollLobby(lobbyCode: string, playerToken?: string): Promise<LobbyInfo> {
    const query = playerToken ? `?playerToken=${encodeURIComponent(playerToken)}` : '';
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}${query}`).then(normalizeLobbyInfo);
  },

  startLobby(lobbyCode: string, hostAccountID: string): Promise<LobbyInfo> {
    return requestJson<LobbyInfo>(`/lobby/${segment(lobbyCode)}/start`, {
      method: 'POST',
      body: JSON.stringify({ hostAccountID }),
    }).then(normalizeLobbyInfo);
  },
};

export const lobbyApi = USE_MOCK ? mockLobbyApi : realLobbyApi;
