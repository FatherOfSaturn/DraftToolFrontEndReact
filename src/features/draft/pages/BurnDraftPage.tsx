import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBurnDraftGame } from '../hooks/useBurnDraftGame';
import { useBurnDraftPoller } from '../hooks/useBurnDraftPoller';
import { BurnDraftBoardView } from '../components/BurnDraftBoardView';
import { StatsBar } from '../components/StatsBar';
import { StatusScreen } from '../../../shared/components/StatusScreen';

interface BurnDraftPageProps {
  gameID: string;
  playerName: string;
}

/**
 * The Burn Draft board screen. Reuses the shared StatsBar and pool sidebar but
 * uses BurnDraftBoardView for the multi-select draft + burn turn.
 */
export function BurnDraftPage({ gameID, playerName }: BurnDraftPageProps) {
  const navigate = useNavigate();
  const {
    loading,
    error,
    cardsDrafted,
    cardsBurnedCount,
    currentPack,
    cardsLeftToDraft,
    cardsDraftedCount,
    waitingForPack,
    readyForDeckBuilder,
    committing,
    turnPlan,
    commitTurn,
    refresh,
  } = useBurnDraftGame(gameID, playerName);

  // Once the backend reports GAME_COMPLETE, send the player to the deck
  // builder with the game type flagged so it knows to use the burn API.
  useEffect(() => {
    if (readyForDeckBuilder) {
      navigate(`/deckbuilder/${encodeURIComponent(gameID)}/${encodeURIComponent(playerName)}`, {
        replace: true,
        state: { gameType: 'burn' },
      });
    }
  }, [readyForDeckBuilder, navigate, gameID, playerName]);

  const handleCanDraft = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleComplete = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useBurnDraftPoller({
    gameID,
    active: waitingForPack,
    onCanDraft: handleCanDraft,
    onComplete: handleComplete,
  });

  if (loading) {
    return <StatusScreen>Loading draft…</StatusScreen>;
  }

  if (error && !currentPack) {
    return (
      <StatusScreen tone="error">
        <div className="flex flex-col items-center gap-md px-lg text-center">
          <p className="font-body-lg">Couldn't load this draft.</p>
          <button className="text-primary font-label-md hover:underline" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      </StatusScreen>
    );
  }

  const totalCards = cardsLeftToDraft + cardsDraftedCount + cardsBurnedCount;

  return (
    <BurnDraftBoardView
      cardsDrafted={cardsDrafted}
      cardsBurnedCount={cardsBurnedCount}
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
      committing={committing}
      turnPlan={turnPlan}
      onCommit={commitTurn}
      statsBar={
        <StatsBar
          playerName={playerName}
          cardsLeftToDraft={cardsLeftToDraft}
          cardsToDraftTotal={totalCards}
          gameID={gameID}
        />
      }
    />
  );
}
