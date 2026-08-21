import { useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftGame } from '../hooks/useDraftGame';
import { usePackMergePoller } from '../hooks/usePackMergePoller';
import { DraftBoardView } from '../components/DraftBoardView';
import { StatsBar } from '../components/StatsBar';
import { StatusScreen } from '../../../shared/components/StatusScreen';

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
 * The Pyramid Draft board screen. Wires the pyramid game hook and merge
 * poller, then composes the shared DraftBoardView with pyramid-specific
 * stats and waiting UI.
 */
export function DraftPage({ gameID, playerName, waitingStrategy = pyramidMergeStrategy }: DraftPageProps) {
  const navigate = useNavigate();
  const {
    loading,
    error,
    gameInfo,
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
  }, [readyForDeckBuilder, navigate, gameID, playerName]);

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

  if (loading) {
    return <StatusScreen>Loading draft…</StatusScreen>;
  }

  if (error && !gameInfo) {
    return (
      <StatusScreen tone="error">
        <div className="flex flex-col items-center gap-md px-lg text-center">
          <p className="font-body-lg">Couldn't load this draft.</p>
          <button
            className="text-primary font-label-md hover:underline"
            onClick={() => void refreshGameInfo()}
          >
            Try again
          </button>
        </div>
      </StatusScreen>
    );
  }

  return (
    <DraftBoardView
      cardsDrafted={player?.cardsDrafted ?? []}
      currentPack={currentPack}
      isWaiting={packsExhausted}
      waitingNode={waitingStrategy.renderWaiting()}
      drafting={drafting}
      onDraft={draftCard}
      canDoublePick={canDoublePick}
      statsBar={
        <StatsBar
          playerName={player?.playerName ?? playerName}
          partnerName={partner?.playerName ?? null}
          doublePicksRemaining={player?.doubleDraftPicksRemaining ?? 0}
          packsLeft={Math.max(0, (player?.cardPacks.length ?? 0) - (player?.currentDraftPack ?? 0))}
          packsTotal={player?.cardPacks.length ?? 0}
          gameID={gameID}
        />
      }
    />
  );
}
