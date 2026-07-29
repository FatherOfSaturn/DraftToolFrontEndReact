import { useEffect, useRef, useState } from 'react';
import { lobbyApi } from '../api/lobbyApi';
import type { LobbyInfo } from '../model/lobbyTypes';

interface UseLobbyPollerOptions {
  lobbyCode: string | null;
  playerToken?: string | null;
  intervalMs?: number;
  enabled?: boolean;
}

export function useLobbyPoller({
  lobbyCode,
  playerToken,
  intervalMs = 12000,
  enabled = true,
}: UseLobbyPollerOptions): {
  lobby: LobbyInfo | null;
  error: string | null;
  loading: boolean;
} {
  const [lobby, setLobby] = useState<LobbyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    const code = lobbyCode;
    if (!code || !enabled) return;

    async function poll() {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      try {
        const result = await lobbyApi.pollLobby(code!, playerToken ?? undefined);
        setLobby(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to poll lobby');
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    }

    poll();

    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [lobbyCode, playerToken, intervalMs, enabled]);

  return { lobby, error, loading };
}
