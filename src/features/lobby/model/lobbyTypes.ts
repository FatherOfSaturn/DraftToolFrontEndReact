export type DraftType = 'pyramid' | 'classic';
export type LobbyStatus = 'waiting' | 'starting' | 'started';

export interface LobbyPlayer {
  accountID: string | null;
  displayName: string;
  slotIndex: number;
  playerToken: string;
  lastPollAt: string;
}

export interface LobbyInfo {
  lobbyCode: string;
  draftType: DraftType;
  config: Record<string, unknown>;
  hostAccountID: string;
  players: LobbyPlayer[];
  minPlayers: number;
  maxPlayers: number;
  gameID: string | null;
  status: LobbyStatus;
  createdAt: string;
  hostAloneSince: string | null;
}

export interface CreateLobbyRequest {
  draftType: DraftType;
  config: Record<string, unknown>;
  hostAccountID: string;
  hostDisplayName: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface JoinLobbyRequest {
  accountID: string | null;
  displayName: string;
}

export interface JoinLobbyResponse {
  lobby: LobbyInfo;
  playerToken: string;
}

export interface LeaveLobbyRequest {
  accountID: string | null;
  playerToken: string | null;
}

export interface KickPlayerRequest {
  hostAccountID: string;
  playerToken: string;
}
