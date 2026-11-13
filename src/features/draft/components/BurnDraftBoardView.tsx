import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useCardFilters } from '../../card-workspace/hooks/useCardFilters';
import { Header } from '../../../shared/components/layout/Header';
import { PoolSidebar, type PoolSidebarTab } from '../../card-workspace/components/PoolSidebar';
import { FilterPanel } from '../../card-workspace/components/FilterPanel';
import { BurnCardGrid } from '../../card-workspace/components/CardGrid';
import { useToast } from '../../../shared/components/Toast';
import type { Card } from '../../../shared/model/cardTypes';
import type { CardPack } from '../model/gameTypes';
import type { TurnPlan } from '../model/burnStats';

export type BurnSelectionMode = 'draft' | 'burn';

export interface BurnDraftBoardViewProps {
  cardsDrafted: Card[];
  cardsBurnedCount: number;
  currentPack: CardPack | null;
  /** True while the player has nothing pickable right now. */
  isWaiting: boolean;
  /** UI shown while `isWaiting` is true (the pool sidebar stays visible). */
  waitingNode: ReactNode;
  committing: boolean;
  /** How many cards must be drafted/burned from the current pack. */
  turnPlan: TurnPlan;
  /** Commit the selected lists together. Resolves true if the turn was accepted. */
  onCommit: (draftCards: Card[], burnCards: Card[]) => Promise<boolean>;
  /** The stat strip to render under the header. */
  statsBar: ReactNode;
  /** Optional header override; defaults to the app's standard Header. */
  header?: ReactNode;
}

/**
 * The Burn Draft board. Unlike the single-pick DraftBoardView, each turn
 * selects N cards to draft AND M cards to burn, then commits both lists in one
 * request. Burn-selected cards get a red outline; draft-selected cards get the
 * primary outline.
 */
export function BurnDraftBoardView({
  cardsDrafted,
  cardsBurnedCount,
  currentPack,
  isWaiting,
  waitingNode,
  committing,
  turnPlan,
  onCommit,
  statsBar,
  header = <Header />,
}: BurnDraftBoardViewProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<BurnSelectionMode>('draft');
  const [draftIDs, setDraftIDs] = useState<string[]>([]);
  const [burnIDs, setBurnIDs] = useState<string[]>([]);
  const [poolTab, setPoolTab] = useState<PoolSidebarTab>('list');
  const committingRef = useRef(false);

  const { filteredCards: visibleCards, filterPanelProps } = useCardFilters(
    currentPack?.cardsInPack ?? []
  );

  const packCardIDs = useMemo(
    () => new Set((currentPack?.cardsInPack ?? []).map((c) => c.cardID)),
    [currentPack]
  );

  // Drop any selections that no longer exist in the current pack (e.g. the
  // pack was passed after an external update).
  useEffect(() => {
    setDraftIDs((ids) => ids.filter((id) => packCardIDs.has(id)));
    setBurnIDs((ids) => ids.filter((id) => packCardIDs.has(id)));
  }, [packCardIDs]);

  // Clear any lingering selection when the player is waiting for a pack.
  useEffect(() => {
    if (!currentPack) {
      setDraftIDs([]);
      setBurnIDs([]);
    }
  }, [currentPack]);

  // A turn with no burn quota can't be burned — keep the user in draft mode.
  useEffect(() => {
    if (turnPlan.burn === 0 && mode === 'burn') setMode('draft');
  }, [turnPlan.burn, mode]);

  const cardsByID = useMemo(
    () => new Map((currentPack?.cardsInPack ?? []).map((c) => [c.cardID, c])),
    [currentPack]
  );

  function toggleCard(card: Card) {
    if (committing) return;

    if (mode === 'draft') {
      if (draftIDs.includes(card.cardID)) {
        setDraftIDs((ids) => ids.filter((id) => id !== card.cardID));
        return;
      }
      if (draftIDs.length >= turnPlan.draft) {
        showToast(
          turnPlan.draft === 0
            ? 'You have no cards to draft this turn.'
            : `You can only draft ${turnPlan.draft} card${turnPlan.draft === 1 ? '' : 's'} this turn.`
        );
        return;
      }
      // Moving a card from burn to draft keeps the total valid.
      setBurnIDs((ids) => ids.filter((id) => id !== card.cardID));
      setDraftIDs((ids) => [...ids, card.cardID]);
    } else {
      if (burnIDs.includes(card.cardID)) {
        setBurnIDs((ids) => ids.filter((id) => id !== card.cardID));
        return;
      }
      if (burnIDs.length >= turnPlan.burn) {
        showToast(
          turnPlan.burn === 0
            ? 'No cards are burned this turn.'
            : `You can only burn ${turnPlan.burn} card${turnPlan.burn === 1 ? '' : 's'} this turn.`
        );
        return;
      }
      setDraftIDs((ids) => ids.filter((id) => id !== card.cardID));
      setBurnIDs((ids) => [...ids, card.cardID]);
    }
  }

  const draftCards = draftIDs.map((id) => cardsByID.get(id)).filter((c): c is Card => Boolean(c));
  const burnCards = burnIDs.map((id) => cardsByID.get(id)).filter((c): c is Card => Boolean(c));

  const draftComplete = draftCards.length === turnPlan.draft;
  const burnComplete = burnCards.length === turnPlan.burn;
  const hasWork = turnPlan.draft + turnPlan.burn > 0;
  const canCommit =
    !committing && !isWaiting && Boolean(currentPack) && hasWork && draftComplete && burnComplete;

  async function handleCommit() {
    if (!canCommit || committingRef.current) return;
    committingRef.current = true;
    try {
      const ok = await onCommit(draftCards, burnCards);
      if (ok) {
        setDraftIDs([]);
        setBurnIDs([]);
        setMode('draft');
      }
    } finally {
      committingRef.current = false;
    }
  }

  const quota = turnPlan;

  return (
    <div className="font-body-md text-on-surface bg-surface-dim min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {header}
      {statsBar}

      <PoolSidebar
        cards={cardsDrafted}
        total={cardsDrafted.length}
        tab={poolTab === 'import' ? 'list' : poolTab}
        onTabChange={setPoolTab}
        showImportTab={false}
        contentBottomPaddingClassName="pb-36 xl:pb-md"
      />

      <main className="mt-28 mb-32 xl:mb-24 xl:mr-80 px-margin-mobile md:px-margin-desktop py-lg">
        {isWaiting ? (
          waitingNode
        ) : !currentPack ? (
          <p className="text-center text-on-surface-variant text-body-md py-xl">
            Waiting for the next pack…
          </p>
        ) : (
          <>
            <FilterPanel {...filterPanelProps} />

            <BurnCardGrid
              cards={visibleCards}
              selectedDraftIDs={draftIDs}
              selectedBurnIDs={burnIDs}
              onSelect={toggleCard}
              disabled={committing}
            />

            {visibleCards.length === 0 && (
              <p className="text-center text-on-surface-variant text-body-md py-xl">
                No cards match these filters.
              </p>
            )}
          </>
        )}
      </main>

      {!isWaiting && currentPack && (
        <div className="fixed bottom-0 left-0 right-0 xl:right-80 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 px-margin-mobile md:px-margin-desktop py-2 md:py-sm pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:pb-sm">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-sm md:gap-md">
            <ModeButton
              active={mode === 'draft'}
              tone="draft"
              icon="content_copy"
              label={`Draft ${draftCards.length}/${quota.draft}`}
              onClick={() => setMode('draft')}
            />
            <ModeButton
              active={mode === 'burn'}
              tone="burn"
              icon="local_fire_department"
              label={`Burn ${burnCards.length}/${quota.burn}`}
              onClick={() => setMode('burn')}
              disabled={quota.burn === 0}
            />

            <div className="ml-auto flex items-center gap-md">
              <span className="hidden md:inline font-label-sm text-label-sm text-outline">
                Burned so far: {cardsBurnedCount}
              </span>
              <button
                type="button"
                onClick={handleCommit}
                disabled={!canCommit}
                className="bg-primary text-on-primary font-label-md md:font-display text-label-md md:text-headline-md py-2 md:py-sm px-md md:px-lg rounded-xl shadow-[0_0_20px_var(--glow-primary-light-soft)] hover:shadow-[0_0_30px_var(--glow-primary-light)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 md:gap-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[24px]">
                  {committing ? 'hourglass_top' : 'gavel'}
                </span>
                {committing ? 'Committing…' : 'Commit Turn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  tone,
  icon,
  label,
  onClick,
  disabled,
}: {
  active: boolean;
  tone: BurnSelectionMode;
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const base =
    'flex items-center gap-1.5 md:gap-2 px-sm md:px-md py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 font-label-sm md:font-label-md text-label-sm md:text-label-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';
  const activeClass =
    tone === 'burn'
      ? 'bg-error/15 border-error text-error'
      : 'bg-primary/15 border-primary text-primary';
  const idleClass =
    tone === 'burn'
      ? 'border-outline-variant/30 text-on-surface-variant hover:border-error/50 hover:text-error'
      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-primary';

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${active ? activeClass : idleClass}`}>
      <span className="material-symbols-outlined text-[16px] md:text-[18px]">{icon}</span>
      {label}
    </button>
  );
}
