import { useEffect, useRef } from 'react';
import { lobbyApi } from '../api/lobbyApi';
import type { LobbyStatus } from '../model/lobbyTypes';

export function useLobbyLeaveGuard(
  lobbyCode: string | null,
  playerToken: string | null,
  status: LobbyStatus | null
): { markLeft: () => void } {
  const leftRef = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const code = lobbyCode;
    const token = playerToken;
    if (!code || !token || status !== 'waiting') return;

    const settledCode = code;
    const settledToken = token;

    function onBeforeUnload() {
      // Best-effort — browser may or may not complete the request
      lobbyApi.leaveLobby(settledCode, settledToken);
    }

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);

      // Only report a leave if the lobby is still waiting. When it flips to
      // starting/started the game has begun — the cleanup fires on the way
      // into the draft board and must not "leave" the started lobby.
      if (!leftRef.current && statusRef.current === 'waiting') {
        lobbyApi.leaveLobby(settledCode, settledToken);
      }
    };
  }, [lobbyCode, playerToken, status]);

  function markLeft() {
    leftRef.current = true;
  }

  return { markLeft };
}
