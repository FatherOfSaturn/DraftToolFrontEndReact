import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useCardFilters } from '../../card-workspace/hooks/useCardFilters';
import { Header } from '../../../shared/components/layout/Header';
import { PoolSidebar, type PoolSidebarTab } from '../../card-workspace/components/PoolSidebar';
import { FilterPanel } from '../../card-workspace/components/FilterPanel';
import { CardGrid } from '../../card-workspace/components/CardGrid';
import { ExtraPickFab } from '../components/ExtraPickFab';
import type { Card } from '../../../shared/model/cardTypes';
import type { CardPack } from '../model/gameTypes';

export interface DraftBoardViewProps {
  cardsDrafted: Card[];
  currentPack: CardPack | null;
  /**
   * True while the player has nothing pickable right now (pyramid: packs
   * exhausted waiting to merge; classic: waiting for the next pack). While
   * true, `waitingNode` is rendered in place of the filter bar + grid, the
   * confirm-pick is hidden, and the extra-pick FAB is hidden.
   */
  isWaiting: boolean;
  /** UI shown while `isWaiting` is true (the pool sidebar stays visible). */
  waitingNode: ReactNode;
  drafting: boolean;
  /** Called for both staged confirm-picks and direct (double-click) picks. */
  onDraft: (card: Card, doublePick: boolean) => Promise<void>;
  /**
   * Pyramid only — when omitted the extra-pick FAB is hidden entirely
   * (used by classic draft, which has no double picks).
   */
  canDoublePick?: boolean;
  /** The stat strip to render under the header. */
  statsBar: ReactNode;
  /** Optional header override; defaults to the app's standard Header. */
  header?: ReactNode;
}

/**
 * The shared draft board screen used by every draft type. Owns only pure UI
 * state (staged pick, double-pick arming, pool sidebar tab) and renders the
 * standard layout: header → stats bar → pool sidebar → filter bar + card
 * grid. Game data and lifecycle live in the caller's hook, so Pyramid Draft
 * and Classic Draft both reuse this component untouched.
 */
export function DraftBoardView({
  cardsDrafted,
  currentPack,
  isWaiting,
  waitingNode,
  drafting,
  onDraft,
  canDoublePick,
  statsBar,
  header = <Header />,
}: DraftBoardViewProps) {
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
      await onDraft(stagedCard, superPickArmed);
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

  async function draftDirect(card: Card) {
    if (drafting || confirmingRef.current) return;
    confirmingRef.current = true;
    try {
      await onDraft(card, superPickArmed);
      setStagedCardID(null);
      setSuperPickArmed(false);
    } finally {
      confirmingRef.current = false;
    }
  }

  return (
    <div className="font-body-md text-on-surface bg-surface-dim min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {header}
      {statsBar}

      {/* Pool sidebar stays visible while waiting so the player can review
          what they've drafted so far. Confirm-pick is hidden. */}
      <PoolSidebar
        cards={cardsDrafted}
        total={cardsDrafted.length}
        tab={poolTab === 'import' ? 'list' : poolTab}
        onTabChange={setPoolTab}
        showImportTab={false}
        confirmAction={
          isWaiting
            ? undefined
            : {
                stagedCard,
                onConfirmPick: confirmPick,
                confirming: drafting,
              }
        }
      />

      <main className="mt-28 mb-16 xl:mr-80 px-margin-mobile md:px-margin-desktop py-lg">
        {isWaiting ? (
          waitingNode
        ) : !currentPack ? (
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
              onDraftDirect={draftDirect}
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

      {!isWaiting && <ExtraPickFab armed={superPickArmed} disabled={!canDoublePick} onClick={toggleSuperPick} />}
    </div>
  );
}
