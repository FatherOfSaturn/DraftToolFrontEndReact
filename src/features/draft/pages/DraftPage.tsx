import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftGame } from '../hooks/useDraftGame';
import { usePackMergePoller } from '../hooks/usePackMergePoller';
import { useCardFilters } from '../../card-workspace/hooks/useCardFilters';
import { Header } from '../../../shared/components/layout/Header';
import { StatsBar } from '../components/StatsBar';
import { PoolSidebar, type PoolSidebarTab } from '../../card-workspace/components/PoolSidebar';
import { FilterPanel } from '../../card-workspace/components/FilterPanel';
import { CardGrid } from '../../card-workspace/components/CardGrid';
import { ExtraPickFab } from '../components/ExtraPickFab';
import { StatusScreen } from '../../../shared/components/StatusScreen';
import type { Card } from '../../../shared/model/cardTypes';

// ---------------------------------------------------------------------------
// Waiting-strategy extension point
//
// DraftPage renders a waiting overlay when the local player has exhausted
// their current packs but the game hasn't merged yet.  The default strategy
// (pyramidMergeStrategy) polls the merge endpoint.  To add a new draft type,
// create an object that satisfies WaitingStrategy and pass it as
// `waitingStrategy` — DraftPage itself stays unchanged.
//
// Polling is always driven by usePackMergePoller inside DraftPage; the
// strategy only needs to declare:
//   - whether the poller should be active       (enablePolling)
//   - what to do when GAME_MERGED fires         (onMerged)
//   - what UI to show while the player waits   (renderWaiting)
// ---------------------------------------------------------------------------

export interface WaitingStrategy {
  /**
   * Return true when DraftPage should be polling the merge endpoint.
   * Receives the current `packsExhausted` flag so strategies can be
   * more selective (e.g. only poll when the player is the one waiting).
   */
  enablePolling: (packsExhausted: boolean) => boolean;

  /**
   * Called when the poller receives GAME_MERGED.
   * `refreshGameInfo` re-fetches the full game from the backend.
   * `navigate` is the router navigate function.
   */
  onMerged: (helpers: {
    gameID: string;
    playerName: string;
    refreshGameInfo: () => Promise<void>;
    navigate: ReturnType<typeof useNavigate>;
  }) => void;

  /**
   * The UI to render in place of the card grid while the player waits.
   * Return null to show nothing (the grid area will just be empty).
   */
  renderWaiting: () => ReactNode;
}

// ---------------------------------------------------------------------------
// Default strategy: Pyramid Draft merge-and-swap polling
// ---------------------------------------------------------------------------

/**
 * The standard two-player Pyramid Draft waiting mode:
 *  - Poll GET /game/merge/{gameID} every 10 s while packsExhausted
 *  - When GAME_MERGED comes back, refresh game data (the server has swapped
 *    packs) then navigate back to /draft — useDraftGame will pick up the
 *    new pack and packsExhausted goes false automatically.
 */
export const pyramidMergeStrategy: WaitingStrategy = {
  enablePolling: (packsExhausted) => packsExhausted,

  // Just refresh game data. DraftPage's useEffect will detect
  // readyForDeckBuilder and navigate to /deckbuilder automatically.
  onMerged: async ({ refreshGameInfo }) => {
    await refreshGameInfo();
  },

  renderWaiting: () => (
    <div className="flex flex-col items-center justify-center gap-md py-2xl text-on-surface-variant">
      <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-body-lg font-medium">Waiting for your opponent to finish their packs…</p>
      <p className="text-body-sm text-on-surface-variant/70">
        The board will update automatically when the packs are ready.
      </p>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// DraftPage
// ---------------------------------------------------------------------------

interface DraftPageProps {
  gameID: string;
  playerName: string;
  /**
   * Controls polling behaviour and waiting UI when the local player has no
   * more packs but the game isn't done.  Defaults to `pyramidMergeStrategy`.
   * Pass a custom implementation for future draft types.
   */
  waitingStrategy?: WaitingStrategy;
}

/**
 * The draft board screen. State + wiring + composition only — the actual UI
 * pieces (filter bar, card grid, pool sidebar, stats bar, extra-pick button)
 * each live in feature components so they can be reused elsewhere.
 */
export function DraftPage({ gameID, playerName, waitingStrategy = pyramidMergeStrategy }: DraftPageProps) {
  const navigate = useNavigate();
  const {
    loading,
    error,
    player,
    partner,
    currentPack,
    canDoublePick,
    packsExhausted,
    readyForDeckBuilder,
    draftCard,
    drafting,
    refreshGameInfo,
  } = useDraftGame(gameID, playerName);

  // If the game was already merged/complete when the player picked their last
  // card, skip the waiting room and go straight to the deck builder.
  useEffect(() => {
    if (readyForDeckBuilder) {
      navigate(`/deckbuilder/${encodeURIComponent(gameID)}/${encodeURIComponent(playerName)}`, { replace: true });
    }
  }, [readyForDeckBuilder, navigate]);

  // Merge poller — always called (hooks must be unconditional); the strategy
  // decides whether it's actually active via enablePolling.
  const handleMerged = useCallback(async () => {
    await waitingStrategy.onMerged({ gameID, playerName, refreshGameInfo, navigate });
  }, [waitingStrategy, gameID, playerName, refreshGameInfo, navigate]);

  usePackMergePoller({
    gameID,
    active: waitingStrategy.enablePolling(packsExhausted),
    onMerged: handleMerged,
  });

  const [superPickArmed, setSuperPickArmed] = useState(false);
  const [stagedCardID, setStagedCardID] = useState<string | null>(null);
  const [poolTab, setPoolTab] = useState<PoolSidebarTab>('list');

  const { filteredCards: visibleCards, filterPanelProps } = useCardFilters(currentPack?.cardsInPack ?? []);

  const stagedCard = useMemo(
    () => currentPack?.cardsInPack.find((c) => c.cardID === stagedCardID) ?? null,
    [currentPack, stagedCardID]
  );

  // A ref (not state) guard against confirmPick firing twice in quick
  // succession — see original comment in previous version for details.
  const confirmingRef = useRef(false);

  function stageCard(card: Card) {
    setStagedCardID((prev) => (prev === card.cardID ? null : card.cardID));
  }

  async function confirmPick() {
    if (!stagedCard || drafting || confirmingRef.current) return;
    confirmingRef.current = true;
    try {
      await draftCard(stagedCard, superPickArmed);
      setStagedCardID(null);
      setSuperPickArmed(false);
    } finally {
      confirmingRef.current = false;
    }
  }

  function toggleSuperPick() {
    if (!canDoublePick) return;
    setSuperPickArmed((v) => !v);
  }

  if (loading) {
    return <StatusScreen>Loading draft…</StatusScreen>;
  }

  if (error) {
    return <StatusScreen tone="error">Something went wrong: {error}</StatusScreen>;
  }


  return (
    <div className="font-body-md text-on-surface bg-surface-dim min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <StatsBar
        playerName={player?.playerName ?? playerName}
        partnerName={partner?.playerName ?? null}
        doublePicksRemaining={player?.doubleDraftPicksRemaining ?? 0}
        packsLeft={Math.max(0, (player?.cardPacks.length ?? 0) - (player?.currentDraftPack ?? 0))}
        packsTotal={player?.cardPacks.length ?? 0}
        gameID={gameID}
      />

      {/* Pool sidebar stays visible while waiting so the player can review
          what they've drafted so far. Confirm-pick is hidden. */}
      <PoolSidebar
        cards={player?.cardsDrafted ?? []}
        total={player?.cardsDrafted.length ?? 0}
        tab={poolTab === 'import' ? 'list' : poolTab}
        onTabChange={setPoolTab}
        showImportTab={false}
        confirmAction={
          packsExhausted
            ? undefined
            : {
                stagedCard,
                onConfirmPick: confirmPick,
                confirming: drafting,
              }
        }
      />

      <main className="mt-28 mb-16 xl:mr-80 px-margin-mobile md:px-margin-desktop py-lg">
        {packsExhausted ? (
          waitingStrategy.renderWaiting()
        ) : !player || !currentPack ? (
          <p className="text-center text-on-surface-variant text-body-md py-xl">
            Waiting for the next pack…
          </p>
        ) : (
          <>
            <FilterPanel {...filterPanelProps} />

            <CardGrid
              cards={visibleCards}
              stagedCardID={stagedCardID}
              onStage={stageCard}
              disabled={drafting}
            />

            {visibleCards.length === 0 && (
              <p className="text-center text-on-surface-variant text-body-md py-xl">
                No cards match these filters.
              </p>
            )}
          </>
        )}
      </main>

      {!packsExhausted && <ExtraPickFab armed={superPickArmed} disabled={!canDoublePick} onClick={toggleSuperPick} />}
    </div>
  );
}
