import { useCallback, useEffect, useMemo, useState } from 'react';
import { classicGameApi } from '../api/classicGameApi';
import { describeDraftError } from '../../../shared/lib/errors';
import { useToast } from '../../../shared/components/Toast';
import type { Card } from '../../../shared/model/cardTypes';
import type { CardPack } from '../model/gameTypes';
import type { ClassicDraftDataResponse, DraftDirection } from '../model/classicGameTypes';
import { computeClassicCardsLeft } from '../model/classicStats';

interface UseClassicDraftGameResult {
  loading: boolean;
  error: string | null;
  gameID: string;
  gameState: string | null;
  draftDirection: DraftDirection | null;
  playerName: string;
  cardsDrafted: Card[];
  currentPack: CardPack | null;
  cardsLeftToDraft: number;
  cardsDraftedCount: number;
  /**
   * True while the player has no pickable pack (activeCardPacks is empty)
   * and the game hasn't completed — the window where draftCheck should be
   * polled for the next pack / generation.
   */
  waitingForPack: boolean;
  /** True once the backend reports GAME_COMPLETE — go to the deck builder. */
  readyForDeckBuilder: boolean;
  drafting: boolean;
  draftCard: (card: Card) => Promise<void>;
  /** Re-fetch draftData — used by the poller when a new pack is available. */
  refresh: () => Promise<void>;
}

export function useClassicDraftGame(gameID: string, playerName: string): UseClassicDraftGameResult {
  const [data, setData] = useState<ClassicDraftDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const next = await classicGameApi.draftData(gameID);
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
    classicGameApi
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

  const cardsDrafted = useMemo(() => player?.cardsDrafted ?? [], [player]);
  const currentPack = useMemo(() => player?.activeCardPacks[0] ?? null, [player]);

  const cardsLeftToDraft = useMemo(() => (player ? computeClassicCardsLeft(player) : 0), [player]);

  const waitingForPack = useMemo(
    () => Boolean(player) && currentPack === null && gameState !== 'GAME_COMPLETE',
    [player, currentPack, gameState]
  );

  const readyForDeckBuilder = useMemo(() => gameState === 'GAME_COMPLETE', [gameState]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const draftCard = useCallback(
    async (card: Card) => {
      if (!player || !currentPack) return;
      setDrafting(true);
      setError(null);
      try {
        const drafted = await classicGameApi.draftCard(gameID, card.cardID);
        if (drafted.cardID !== card.cardID) {
          throw new Error('Card drafted on backend did not match the card requested.');
        }
        // The pack (or a fresh one) is now held by another seat — pull the
        // authoritative draftData so our active queue reflects reality.
        await load();
      } catch (err) {
        // Draft failures must not blank the board or rethrow into the click
        // handler — surface a friendly toast and carry on.
        showToast(describeDraftError(err));
      } finally {
        setDrafting(false);
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
    currentPack,
    cardsLeftToDraft,
    cardsDraftedCount: cardsDrafted.length,
    waitingForPack,
    readyForDeckBuilder,
    drafting,
    draftCard,
    refresh,
  };
}
