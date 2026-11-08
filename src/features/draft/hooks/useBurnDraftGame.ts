import { useCallback, useEffect, useMemo, useState } from 'react';
import { burnGameApi } from '../api/burnGameApi';
import { describeDraftError } from '../../../shared/lib/errors';
import { useToast } from '../../../shared/components/Toast';
import type { Card } from '../../../shared/model/cardTypes';
import type { CardPack } from '../model/gameTypes';
import type { BurnDraftDataResponse, BurnRemainderPolicy } from '../model/burnGameTypes';
import type { DraftDirection } from '../model/classicGameTypes';
import { computeBurnCardsLeft, planTurn, type TurnPlan } from '../model/burnStats';

interface UseBurnDraftGameResult {
  loading: boolean;
  error: string | null;
  gameID: string;
  gameState: string | null;
  draftDirection: DraftDirection | null;
  playerName: string;
  cardsDrafted: Card[];
  cardsBurned: Card[];
  currentPack: CardPack | null;
  cardsLeftToDraft: number;
  cardsDraftedCount: number;
  cardsBurnedCount: number;
  /** How many cards this player must draft and burn from the current pack. */
  turnPlan: TurnPlan;
  cardsDraftedPerPack: number;
  cardsBurnedPerPack: number;
  remainderPolicy: BurnRemainderPolicy;
  /**
   * True while the player has no pickable pack and the game hasn't completed —
   * the window where draftCheck should be polled for the next pack.
   */
  waitingForPack: boolean;
  /** True once the backend reports GAME_COMPLETE — go to the deck builder. */
  readyForDeckBuilder: boolean;
  committing: boolean;
  /** Commit the selected draft + burn cards for this turn. Resolves true on success. */
  commitTurn: (draftCards: Card[], burnCards: Card[]) => Promise<boolean>;
  /** Re-fetch draftData — used by the poller when a new pack is available. */
  refresh: () => Promise<void>;
}

export function useBurnDraftGame(gameID: string, playerName: string): UseBurnDraftGameResult {
  const [data, setData] = useState<BurnDraftDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const next = await burnGameApi.draftData(gameID);
      setData(next);
      setError(null);
    } catch (err) {
      setError(describeDraftError(err));
      showToast("Couldn't load this draft. Please try again.");
      throw err;
    }
  }, [gameID, showToast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    burnGameApi
      .draftData(gameID)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(describeDraftError(err));
          showToast("Couldn't load this draft. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameID, showToast]);

  const player = data?.player ?? null;
  const gameState = data?.gameState ?? null;
  const draftDirection = data?.draftDirection ?? null;
  const cardsDraftedPerPack = data?.cardsDraftedPerPack ?? 0;
  const cardsBurnedPerPack = data?.cardsBurnedPerPack ?? 0;
  const remainderPolicy = data?.remainderPolicy ?? 'BURN_EXTRAS';

  const cardsDrafted = useMemo(() => player?.cardsDrafted ?? [], [player]);
  const cardsBurned = useMemo(() => player?.cardsBurned ?? [], [player]);
  const currentPack = useMemo(() => player?.activeCardPacks[0] ?? null, [player]);

  const cardsLeftToDraft = useMemo(() => (player ? computeBurnCardsLeft(player) : 0), [player]);

  const turnPlan = useMemo<TurnPlan>(() => {
    if (!currentPack) return { draft: 0, burn: 0 };
    return planTurn(
      currentPack.cardsInPack.length,
      cardsDraftedPerPack,
      cardsBurnedPerPack,
      remainderPolicy
    );
  }, [currentPack, cardsDraftedPerPack, cardsBurnedPerPack, remainderPolicy]);

  const waitingForPack = useMemo(
    () => Boolean(player) && currentPack === null && gameState !== 'GAME_COMPLETE',
    [player, currentPack, gameState]
  );

  const readyForDeckBuilder = useMemo(() => gameState === 'GAME_COMPLETE', [gameState]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const commitTurn = useCallback(
    async (draftCards: Card[], burnCards: Card[]): Promise<boolean> => {
      if (!player || !currentPack) return false;
      setCommitting(true);
      setError(null);
      try {
        await burnGameApi.draft(gameID, {
          draftCardIds: draftCards.map((c) => c.cardID),
          burnCardIds: burnCards.map((c) => c.cardID),
        });
        // Pull authoritative draftData so our active pack reflects reality.
        await load();
        return true;
      } catch (err) {
        // Turn failures must not blank the board — surface a friendly toast.
        showToast(describeDraftError(err));
        return false;
      } finally {
        setCommitting(false);
      }
    },
    [gameID, player, currentPack, load, showToast]
  );

  return {
    loading,
    error,
    gameID,
    gameState,
    draftDirection,
    playerName,
    cardsDrafted,
    cardsBurned,
    currentPack,
    cardsLeftToDraft,
    cardsDraftedCount: cardsDrafted.length,
    cardsBurnedCount: cardsBurned.length,
    turnPlan,
    cardsDraftedPerPack,
    cardsBurnedPerPack,
    remainderPolicy,
    waitingForPack,
    readyForDeckBuilder,
    committing,
    commitTurn,
    refresh,
  };
}
