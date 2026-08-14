import { useCallback, useEffect, useMemo, useState } from 'react';
import { gameApi } from '../api/gameApi';
import { getErrorMessage } from '../../../shared/lib/errors';
import type { Card } from '../../../shared/model/cardTypes';
import type { CardPack, GameInfo, Player } from '../model/gameTypes';

interface UseDraftGameResult {
  loading: boolean;
  error: string | null;
  gameInfo: GameInfo | null;
  player: Player | null;
  partner: Player | null;
  currentPack: CardPack | null;
  packsDraftedPercent: number;
  cardsRemainingInPack: number;
  canDoublePick: boolean;
  /**
   * True when the local player has drafted every pack they were assigned
   * (currentDraftPack > cardPacks.length) but the game itself is not yet
   * in a terminal state (GAME_MERGED / GAME_COMPLETE).  This is the window
   * where they need to wait for their opponent to finish before the packs
   * are swapped.
   */
  /**
   * True when the local player has exhausted their packs AND the game is
   * already in a terminal state (GAME_MERGED or GAME_COMPLETE) — meaning
   * they should go straight to the deck builder without waiting.
   */
  readyForDeckBuilder: boolean;
  packsExhausted: boolean;
  draftCard: (card: Card, doublePick: boolean) => Promise<void>;
  drafting: boolean;
  /** Replace the full GameInfo in state — used after a successful merge poll. */
  refreshGameInfo: () => Promise<void>;
}

export function useDraftGame(gameID: string, playerName: string): UseDraftGameResult {
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGameInfo(null);
    gameApi
      .fetchGameData(gameID)
      .then((info) => {
        if (!cancelled) setGameInfo(info);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameID]);

  const player = useMemo(
    () => gameInfo?.players.find((p) => p.playerName === playerName) ?? null,
    [gameInfo, playerName]
  );

  const partner = useMemo(
    () => gameInfo?.players.find((p) => p.playerName !== playerName) ?? null,
    [gameInfo, playerName]
  );

  const currentPack = useMemo(
    () => player?.cardPacks.find((pack) => pack.packNumber === player.currentDraftPack) ?? null,
    [player]
  );

  const packsDraftedPercent = useMemo(() => {
    if (!player || player.cardPacks.length === 0) return 0;
    return (player.currentDraftPack / player.cardPacks.length) * 100;
  }, [player]);

  const cardsRemainingInPack = currentPack?.cardsInPack.length ?? 0;

  const packsExhausted = useMemo(() => {
    if (!player || !gameInfo) return false;
    const terminal = gameInfo.gameState === 'GAME_MERGED' || gameInfo.gameState === 'GAME_COMPLETE';
    if (terminal) return false;
    return player.currentDraftPack >= player.cardPacks.length;
  }, [player, gameInfo]);

  // The player has picked their last card AND the game is already in a
  // terminal state — skip the waiting room, go straight to deck builder.
  const readyForDeckBuilder = useMemo(() => {
    if (!player || !gameInfo) return false;
    const terminal = gameInfo.gameState === 'GAME_MERGED' || gameInfo.gameState === 'GAME_COMPLETE';
    return terminal && player.currentDraftPack >= player.cardPacks.length;
  }, [player, gameInfo]);

  const refreshGameInfo = useCallback(async () => {
    try {
      const info = await gameApi.fetchGameData(gameID);
      setGameInfo(info);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, [gameID]);

  // Mirrors evaluateCheckbox(): a double pick is only available if this
  // specific pack hasn't already been double-drafted, and the player has
  // picks remaining.
  const canDoublePick = useMemo(() => {
    if (!player || !currentPack) return false;
    if (currentPack.doubleDraftedFlag) return false;
    return player.doubleDraftPicksRemaining > 0;
  }, [player, currentPack]);

  const draftCard = useCallback(
    async (card: Card, doublePick: boolean) => {
      if (!gameInfo || !player || !currentPack) return;
      setDrafting(true);
      setError(null);
      try {
        const drafted = await gameApi.draftCard(
          gameInfo.gameID,
          currentPack.packNumber,
          card.cardID,
          doublePick
        );

        if (drafted.cardID !== card.cardID) {
          throw new Error('Card drafted on backend did not match the card requested.');
        }

        setGameInfo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map((p) => {
              if (p.accountID !== player.accountID) return p;

              const nextCardsDrafted = [...p.cardsDrafted, card];

              if (doublePick) {
                // Stay on the same pack, just remove the card and burn a pick.
                return {
                  ...p,
                  cardsDrafted: nextCardsDrafted,
                  doubleDraftPicksRemaining: p.doubleDraftPicksRemaining - 1,
                  cardPacks: p.cardPacks.map((pack) =>
                    pack.packNumber === currentPack.packNumber
                      ? {
                          ...pack,
                          cardsInPack: pack.cardsInPack.filter((c) => c.cardID !== card.cardID),
                          doubleDraftedFlag: true,
                        }
                      : pack
                  ),
                };
              }

              // Normal pick: advance to the next pack.
              return {
                ...p,
                cardsDrafted: nextCardsDrafted,
                currentDraftPack: p.currentDraftPack + 1,
              };
            }),
          };
        });

        // If this normal pick exhausted the player's packs, re-fetch game
        // data immediately so the frontend picks up any server-side state
        // change (e.g. GAME_COMPLETE when both players finish).
        if (!doublePick && player.currentDraftPack + 1 >= player.cardPacks.length) {
          refreshGameInfo().catch(() => {
            // Ignore — merge poller handles retries.
          });
        }
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setDrafting(false);
      }
    },
    [gameInfo, player, currentPack, refreshGameInfo]
  );

  return {
    loading,
    error,
    gameInfo,
    player,
    partner,
    currentPack,
    packsDraftedPercent,
    cardsRemainingInPack,
    canDoublePick,
    packsExhausted,
    readyForDeckBuilder,
    draftCard,
    drafting,
    refreshGameInfo,
  };
}
