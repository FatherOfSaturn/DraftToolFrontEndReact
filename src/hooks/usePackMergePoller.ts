import { useCallback, useEffect, useRef } from 'react';
import { gameApi } from '../api/gameApi';

interface UsePackMergePollerOptions {
  /** The game to poll. */
  gameID: string;
  /** Whether polling should be active right now. */
  active: boolean;
  /** How often to poll in milliseconds. Defaults to 10 000. */
  intervalMs?: number;
  /** Called once when the backend returns `GAME_MERGED`. */
  onMerged: () => void;
  /** Optional: called when a poll fails (network error, etc.). */
  onError?: (err: unknown) => void;
}

/**
 * Polls `GET /game/merge/{gameID}` while `active` is true.
 *
 * Stops itself and calls `onMerged` as soon as the backend returns
 * `GAME_MERGED`.  Mirrors the Angular `startInterval / ngOnDestroy`
 * pattern but lives entirely in a hook so any component (or future
 * draft-type variant) can opt in just by setting `active={true}`.
 *
 * Changing `gameID`, `onMerged`, or `onError` while polling is active
 * restarts the poller automatically — no manual cleanup needed by the
 * caller.
 */
export function usePackMergePoller({
  gameID,
  active,
  intervalMs = 10_000,
  onMerged,
  onError,
}: UsePackMergePollerOptions): void {
  // Keep stable refs so the interval callback doesn't close over stale values
  // and we don't have to restart the timer every time a render happens.
  const onMergedRef = useRef(onMerged);
  const onErrorRef = useRef(onError);
  useEffect(() => { onMergedRef.current = onMerged; }, [onMerged]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const poll = useCallback(async () => {
    try {
      const status = await gameApi.triggerPackMergeAndSwap(gameID);
      if (status?.gameState === 'GAME_MERGED') {
        onMergedRef.current();
      }
    } catch (err) {
      onErrorRef.current?.(err);
    }
  }, [gameID]);

  useEffect(() => {
    if (!active) return;

    // Fire once immediately so the player doesn't wait a full interval
    // before the first check.
    poll();

    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [active, poll, intervalMs]);
}
