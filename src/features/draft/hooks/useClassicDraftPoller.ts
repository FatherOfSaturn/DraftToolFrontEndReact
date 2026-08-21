import { useCallback, useEffect, useRef } from 'react';
import { classicGameApi } from '../api/classicGameApi';

interface UseClassicDraftPollerOptions {
  /** The classic game to poll. */
  gameID: string;
  /**
   * Whether polling should be active right now. Set this true while the
   * player has no pickable pack and the game is not complete, false the
   * moment they have a pack in hand.
   */
  active: boolean;
  /** How often to poll in milliseconds. Defaults to 3 000. */
  intervalMs?: number;
  /**
   * Called when draftCheck reports `canDraft: true` — the caller should
   * re-fetch draftData to pull the newly passed pack.
   */
  onCanDraft: () => void | Promise<void>;
  /** Called when draftCheck reports `gameState: GAME_COMPLETE`. */
  onComplete: () => void | Promise<void>;
  /** Optional: called when a poll fails (network error, etc.). */
  onError?: (err: unknown) => void;
}

/**
 * Polls `GET /classic-game/{gameID}/draftCheck` while
 * `active` is true. Mirrors usePackMergePoller: fires immediately on start,
 * never overlaps requests, and stops when the game completes.
 *
 * draftCheck is intentionally a cheap "can I draft yet?" probe. The caller
 * pulls the actual pack via draftData when `onCanDraft` fires. The player's
 * identity comes from the `X-Player-Token` header (see classicGameApi).
 */
export function useClassicDraftPoller({
  gameID,
  active,
  intervalMs = 3_000,
  onCanDraft,
  onComplete,
  onError,
}: UseClassicDraftPollerOptions): void {
  const onCanDraftRef = useRef(onCanDraft);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const inFlightRef = useRef(false);
  const completedRef = useRef(false);
  const generationRef = useRef(0);
  useEffect(() => { onCanDraftRef.current = onCanDraft; }, [onCanDraft]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const poll = useCallback(async (generation: number) => {
    if (inFlightRef.current || completedRef.current) return;
    inFlightRef.current = true;
    try {
      const status = await classicGameApi.draftCheck(gameID);
      if (generation !== generationRef.current) return;
      if (status.gameState === 'GAME_COMPLETE' && !completedRef.current) {
        completedRef.current = true;
        await onCompleteRef.current();
      } else if (status.canDraft) {
        await onCanDraftRef.current();
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

    completedRef.current = false;

    // Fire once immediately so the player doesn't wait a full interval
    // before the first check.
    poll(generation);

    const id = setInterval(() => poll(generation), intervalMs);
    return () => clearInterval(id);
  }, [active, poll, intervalMs]);
}
