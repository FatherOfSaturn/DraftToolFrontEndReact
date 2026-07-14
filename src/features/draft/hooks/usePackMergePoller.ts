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
  onMerged: () => void | Promise<void>;
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
  const inFlightRef = useRef(false);
  const mergedRef = useRef(false);
  const generationRef = useRef(0);
  useEffect(() => { onMergedRef.current = onMerged; }, [onMerged]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const poll = useCallback(async (generation: number) => {
    if (inFlightRef.current || mergedRef.current) return;
    inFlightRef.current = true;
    try {
      const status = await gameApi.triggerPackMergeAndSwap(gameID);
      if (generation !== generationRef.current) return;
      if (status?.gameState === 'GAME_MERGED' && !mergedRef.current) {
        await onMergedRef.current();
        mergedRef.current = true;
      }
    } catch (err) {
      if (generation === generationRef.current) onErrorRef.current?.(err);
    } finally {
      inFlightRef.current = false;
    }
  }, [gameID]);

  useEffect(() => {
    const generation = ++generationRef.current;
    if (!active) return;

    mergedRef.current = false;

    // Fire once immediately so the player doesn't wait a full interval
    // before the first check.
    poll(generation);

    const id = setInterval(() => poll(generation), intervalMs);
    return () => clearInterval(id);
  }, [active, poll, intervalMs]);
}
