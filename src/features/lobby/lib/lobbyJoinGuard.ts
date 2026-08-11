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
