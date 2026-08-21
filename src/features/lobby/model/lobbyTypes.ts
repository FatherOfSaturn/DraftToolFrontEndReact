export type DraftType = 'pyramid' | 'classic';
export type LobbyStatus = 'waiting' | 'starting' | 'started';

export interface LobbyPlayer {
  accountID: string | null;
  displayName: string;
  slotIndex: number;
  /**
   * The backend never serializes player tokens in lobby responses
   * (`@JsonIgnore`) — each owner only receives their own token once, in the
   * create/join response. Present only in mock mode.
   */
  playerToken?: string;
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
  playerToken: string;
}

export interface KickPlayerRequest {
  /** The caller's own lobby token (proves host identity for a kick). */
  playerToken: string;
  /** Slot index of the player to remove — the target token is resolved server-side. */
  targetSlotIndex: number;
}

export interface StartGameRequest {
  /** The caller's own lobby token (proves host identity to start). */
  playerToken: string;
}
