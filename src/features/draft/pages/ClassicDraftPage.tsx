import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClassicDraftGame } from '../hooks/useClassicDraftGame';
import { useClassicDraftPoller } from '../hooks/useClassicDraftPoller';
import { DraftBoardView } from '../components/DraftBoardView';
import { StatsBar } from '../components/StatsBar';
import { StatusScreen } from '../../../shared/components/StatusScreen';

interface ClassicDraftPageProps {
  gameID: string;
  playerName: string;
}

/**
 * The Classic Draft board screen. Uses the same shared DraftBoardView as
 * Pyramid Draft but with classic-specific stats (cards left to draft, no
 * partner / no extra picks) and a draftCheck poller that picks up the next
 * pack as it is passed seat to seat.
 */
export function ClassicDraftPage({ gameID, playerName }: ClassicDraftPageProps) {
  const navigate = useNavigate();
  const {
    loading,
    error,
    cardsDrafted,
    currentPack,
    cardsLeftToDraft,
    cardsDraftedCount,
    waitingForPack,
    readyForDeckBuilder,
    drafting,
    draftCard,
    refresh,
  } = useClassicDraftGame(gameID, playerName);

  // Once the backend reports GAME_COMPLETE, send the player to the deck
  // builder with the game type flagged so it knows to use the classic API.
  useEffect(() => {
    if (readyForDeckBuilder) {
      navigate(`/deckbuilder/${encodeURIComponent(gameID)}/${encodeURIComponent(playerName)}`, {
        replace: true,
        state: { gameType: 'classic' },
      });
    }
  }, [readyForDeckBuilder, navigate, gameID, playerName]);

  const handleCanDraft = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleComplete = useCallback(async () => {
    // Re-pull draftData; the updated GAME_COMPLETE state flips
    // readyForDeckBuilder and the effect above handles navigation.
    await refresh();
  }, [refresh]);

  // Poll draftCheck while the player has no pickable pack but the game is
  // still running. Once a pack shows up (canDraft) refresh pulls it in;
  // waitingForPack goes false and the poller stops itself.
  useClassicDraftPoller({
    gameID,
    playerName,
    active: waitingForPack,
    onCanDraft: handleCanDraft,
    onComplete: handleComplete,
  });

  if (loading) {
    return <StatusScreen>Loading draft…</StatusScreen>;
  }

  if (error) {
    return <StatusScreen tone="error">Something went wrong: {error}</StatusScreen>;
  }

  const totalCardsToDraft = cardsLeftToDraft + cardsDraftedCount;

  return (
    <DraftBoardView
      cardsDrafted={cardsDrafted}
      currentPack={currentPack}
      isWaiting={waitingForPack}
      waitingNode={
        <div className="flex flex-col items-center justify-center gap-md py-2xl text-on-surface-variant">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-body-lg font-medium">Waiting for your next pack to arrive…</p>
          <p className="text-body-sm text-on-surface-variant/70">
            The pack is being passed to the next seat — the board updates automatically.
          </p>
        </div>
      }
      drafting={drafting}
      onDraft={draftCard}
      statsBar={
        <StatsBar
          playerName={playerName}
          cardsLeftToDraft={cardsLeftToDraft}
          cardsToDraftTotal={totalCardsToDraft}
          gameID={gameID}
        />
      }
    />
  );
}
