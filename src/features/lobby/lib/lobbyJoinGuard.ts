import { lobbyApi } from '../api/lobbyApi';
import type { LobbyInfo } from '../model/lobbyTypes';

export const ALREADY_IN_LOBBY_MESSAGE = 'You are logged in, and already in this lobby!';

/** True when a raw error string indicates the account is already in the lobby. */
export function isAlreadyInLobbyError(raw: string): boolean {
  return raw.toLowerCase().includes('already in lobby');
}

/** True when `accountID` is seated in the given lobby. */
export function isAccountInLobby(lobby: LobbyInfo, accountID: string | null): boolean {
  return !!accountID && lobby.players.some((p) => p.accountID === accountID);
}

/** Everything the view knows about "me" for matching against a polled roster. */
export interface SelfIdentity {
  accountID?: string | null;
  /** The caller's own lobby token. Never serialized by the real backend. */
  playerToken?: string | null;
  /** Stable per-player seat once a join/create has been accepted. */
  slotIndex?: number | null;
  /** The display name we joined with (only reliable when supplied). */
  displayName?: string | null;
}

/**
 * Find "me" in a polled lobby. The real backend never serializes player tokens,
 * so logged-in users must be matched by accountID and anonymous users by their
 * stable slotIndex (once seated) or displayName. Matching priority:
 * accountID > slotIndex > displayName > playerToken (token is mock-only).
 */
export function findMyPlayer(
  lobby: LobbyInfo,
  self: SelfIdentity
): LobbyInfo['players'][number] | undefined {
  const { accountID, playerToken, slotIndex, displayName } = self;

  if (accountID) {
    const byAccount = lobby.players.find((p) => p.accountID === accountID);
    if (byAccount) return byAccount;
  }

  if (typeof slotIndex === 'number' && !accountID) {
    const bySlot = lobby.players.find((p) => p.slotIndex === slotIndex);
    if (bySlot) return bySlot;
  }

  if (playerToken) {
    const byToken = lobby.players.find((p) => p.playerToken === playerToken);
    if (byToken) return byToken;
  }

  if (displayName) {
    return lobby.players.find((p) => p.displayName === displayName);
  }

  return undefined;
}

/** True when a lobby lists the same account more than once — a backend that
 * failed to dedup let the join through. */
export function hasDuplicateAccount(lobby: LobbyInfo, accountID: string | null): boolean {
  return !!accountID && lobby.players.filter((p) => p.accountID === accountID).length > 1;
}

/**
 * Tokenless pre-join check: is this account already seated? A failed poll
 * (e.g. tokenless polling unsupported) is treated as "unknown" (false) so
 * callers fall through to a normal join and let its own error surface.
 */
export async function accountIsSeatedInLobby(
  lobbyCode: string,
  accountID: string
): Promise<boolean> {
  try {
    const lobby = await lobbyApi.pollLobby(lobbyCode);
    return isAccountInLobby(lobby, accountID);
  } catch {
    return false;
  }
}
