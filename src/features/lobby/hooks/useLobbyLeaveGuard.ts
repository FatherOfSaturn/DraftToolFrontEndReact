import { useEffect, useRef } from 'react';
import { lobbyApi } from '../api/lobbyApi';
import type { LobbyStatus } from '../model/lobbyTypes';

export function useLobbyLeaveGuard(
  lobbyCode: string | null,
  playerToken: string | null,
  status: LobbyStatus | null
): { markLeft: () => void } {
  const leftRef = useRef(false);

  useEffect(() => {
    const code = lobbyCode;
    const token = playerToken;
    if (!code || status !== 'waiting') return;

    function onBeforeUnload() {
      // Best-effort — browser may or may not complete the request
      lobbyApi.leaveLobby(code!, null, token);
    }

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);

      if (!leftRef.current) {
        lobbyApi.leaveLobby(code!, null, token);
      }
    };
  }, [lobbyCode, playerToken, status]);

  function markLeft() {
    leftRef.current = true;
  }

  return { markLeft };
}
