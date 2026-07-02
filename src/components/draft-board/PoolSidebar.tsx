import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CARD_COLOR_BADGE, cardColors, cmcBucketFor, type ManaColor } from './cardHelpers';
import { importDecklist } from './importDecklist';
import { BASIC_LANDS } from '../../lib/basicLands';
import type { Card } from '../../types';

export type PoolSidebarTab = 'list' | 'sideboard' | 'analytics' | 'import';

export interface ConfirmPickAction {
  stagedCard: Card | null;
  onConfirmPick: () => void;
  confirming: boolean;
}

export interface PoolSidebarProps {
  cards: Card[];
  total: number;
  tab: PoolSidebarTab;
  onTabChange: (tab: PoolSidebarTab) => void;
  /** Called with the resolved Card[] when the Import tab's "Import
   * Decklist" button is clicked. Omit the Import tab entirely by not
   * rendering it — see `showImportTab`. */
  onImportCards?: (cards: Card[]) => void;
  /** Set to false to hide the Import tab/button altogether (e.g. the
   * draft board doesn't want players importing arbitrary cards into a
   * pack — only the deck builder does). Defaults to true. */
  showImportTab?: boolean;
  /** The Confirm Pick footer action. Omit entirely (don't pass this
   * prop) for screens with no staging/confirmation step — e.g. the deck
   * builder, where clicking a card adds it directly. When omitted, no
   * footer renders at all. */
  confirmAction?: ConfirmPickAction;
  /** Pixels of fixed header content above this sidebar — the draft
   * board has Header (64px) + StatsBar (48px) = 112px above it; a page
   * with just Header and no StatsBar (like the deck builder) should
   * pass 64 instead, or the sidebar sits 48px too low with a dead gap
   * above it and the same amount of unusable space cut off the bottom.
   * Defaults to 112 to match the draft board's existing layout. */
  topOffsetPx?: number;
  /** Sideboard contents. Omit the Sideboard tab entirely by not passing
   * this prop — e.g. the draft board has no sideboard concept, only the
   * deck builder does. */
  sideboardCards?: Card[];
  /** Called when a card in the List tab is clicked — moves it to the
   * sideboard. Only meaningful when `sideboardCards` is provided. */
  onMoveToSideboard?: (card: Card) => void;
  /** Called when a card in the Sideboard tab is clicked — moves it back
   * to the main list. */
  onMoveToList?: (card: Card) => void;
  /** Provide to show the Quick Add Land row at the top of the List tab
   * (e.g. the deck builder). Omit to hide it (e.g. the draft board,
   * where adding arbitrary lands doesn't make sense). Called with the
   * land's name when one of the WUBRG buttons is clicked. */
  onAddLand?: (name: string) => void;
  /** Provide to show an Export button at the bottom of the List tab.
   * Called when clicked — the caller decides what "export" means
   * (e.g. copy a decklist to the clipboard). Omit to hide the button. */
  onExport?: () => void;
}

/**
 * The fixed "My Pool" sidebar: a List/Analytics/Import tab switch over
 * the player's card pool, plus an optional Confirm Pick action.
 * Reusable wherever a card pool needs to be shown — the draft board
 * uses the Confirm Pick footer (pick-then-confirm flow); the deck
 * builder omits it (cards are added directly, no staging step).
 */
export function PoolSidebar({
  cards,
  total,
  tab,
  onTabChange,
  onImportCards,
  showImportTab = true,
  confirmAction,
  topOffsetPx = 112,
  sideboardCards,
  onMoveToSideboard,
  onMoveToList,
  onAddLand,
  onExport,
}: PoolSidebarProps) {
  const showSideboardTab = sideboardCards !== undefined;

  return (
    <aside
      className="fixed right-0 w-80 hidden xl:flex flex-col glass-panel border-l border-outline-variant/20 shadow-2xl z-30"
      style={{ top: topOffsetPx, height: `calc(100vh - ${topOffsetPx}px)` }}
    >
      <div className="p-md border-b border-outline-variant/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-headline-md text-primary">My Pool</h2>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-label-sm">
            {cards.length}/{total}
          </span>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/20">
          <PoolTabButton active={tab === 'list'} onClick={() => onTabChange('list')}>
            List
          </PoolTabButton>
          {showSideboardTab && (
            <PoolTabButton active={tab === 'sideboard'} onClick={() => onTabChange('sideboard')}>
              Sideboard
            </PoolTabButton>
          )}
          <PoolTabButton active={tab === 'analytics'} onClick={() => onTabChange('analytics')}>
            Analytics
          </PoolTabButton>
          {showImportTab && (
            <PoolTabButton active={tab === 'import'} onClick={() => onTabChange('import')}>
              Import
            </PoolTabButton>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-md">
        {tab === 'list' && (
          <PoolList cards={cards} onRowClick={onMoveToSideboard} onAddLand={onAddLand} onExport={onExport} />
        )}
        {tab === 'sideboard' && showSideboardTab && (
          <PoolList cards={sideboardCards} onRowClick={onMoveToList} emptyMessage="No cards in sideboard" />
        )}
        {tab === 'analytics' && <PoolAnalytics cards={cards} />}
        {tab === 'import' && showImportTab && (
          <ImportDecklistTab onImportCards={(imported) => onImportCards?.(imported)} />
        )}
      </div>

      {confirmAction && (
        <div className="p-md bg-surface-container-high border-t border-outline-variant/20 flex flex-col gap-sm">
          {confirmAction.stagedCard && (
            <p className="text-label-sm text-on-surface-variant text-center">
              Staged: <span className="text-primary font-medium">{confirmAction.stagedCard.name}</span>
            </p>
          )}
          <button
            className="w-full bg-primary text-on-primary font-display text-headline-md py-4 rounded-xl shadow-[0_0_20px_rgba(213,186,255,0.4)] hover:shadow-[0_0_30px_rgba(213,186,255,0.6)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            disabled={!confirmAction.stagedCard || confirmAction.confirming}
            onClick={confirmAction.onConfirmPick}
          >
            {confirmAction.confirming ? 'Confirming…' : 'Confirm Pick'}
          </button>
        </div>
      )}
    </aside>
  );
}

interface PoolTabButtonProps {
  active: boolean;
  onClick: () => void;
  children: string;
}

function PoolTabButton({ active, onClick, children }: PoolTabButtonProps) {
  return (
    <button
      className={`flex-1 py-1.5 px-1 text-label-sm rounded-md transition-colors whitespace-nowrap ${
        active ? 'bg-primary text-on-primary font-bold shadow-lg' : 'text-on-surface-variant hover:text-on-surface'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ImportDecklistTabProps {
  onImportCards: (cards: Card[]) => void;
}

function ImportDecklistTab({ onImportCards }: ImportDecklistTabProps) {
  const [text, setText] = useState('');
  const [unknownNames, setUnknownNames] = useState<string[]>([]);
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);

  function handleImportClick() {
    const { cards, unknownNames: unknown } = importDecklist(text);
    setUnknownNames(unknown);
    setLastImportCount(cards.length);
    if (cards.length > 0) onImportCards(cards);
  }

  return (
    <div className="flex flex-col gap-sm h-full">
      <p className="text-on-surface-variant font-label-sm text-label-sm opacity-70">
        Paste a decklist (Standard MTG format) to add every card straight to your pool. (Ephemeral)
      </p>

      <textarea
        className="flex-1 min-h-[240px] w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-sm font-label-sm text-label-sm text-on-surface focus:outline-none focus:border-primary-container transition-all resize-none"
        placeholder={'4 Counterspell\n4 Brainstorm\n20 Island...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {unknownNames.length > 0 && (
        <p className="text-[11px] text-on-surface-variant/80 leading-snug">
          <span className="text-tertiary font-semibold">{unknownNames.length}</span> card
          {unknownNames.length === 1 ? '' : 's'} not in the local type lookup yet (added as
          Unknown): {unknownNames.slice(0, 4).join(', ')}
          {unknownNames.length > 4 ? '…' : ''}
        </p>
      )}
      {lastImportCount !== null && (
        <p className="text-label-sm text-secondary text-center">
          {lastImportCount > 0 ? `Added ${lastImportCount} card${lastImportCount === 1 ? '' : 's'}.` : 'No cards found in that text.'}
        </p>
      )}
      <button
        className="w-full bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={handleImportClick}
        disabled={text.trim().length === 0}
      >
        Import Decklist
      </button>
    </div>
  );
}

interface GroupedCard {
  /** One representative Card for rendering (name/colors/art are the
   * same across copies — only count differs). */
  card: Card;
  count: number;
}

/** Groups cards by name so "3x Swamp" renders as a single row instead
 * of three identical ones — order is preserved by first-seen position
 * within the (already-reversed, most-recent-first) input array. */
function groupCardsByName(cards: Card[]): GroupedCard[] {
  const order: string[] = [];
  const groups = new Map<string, GroupedCard>();

  for (const card of cards) {
    const existing = groups.get(card.name);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(card.name, { card, count: 1 });
      order.push(card.name);
    }
  }

  return order.map((name) => groups.get(name)!);
}

function PoolList({
  cards,
  onRowClick,
  emptyMessage = 'No cards drafted yet',
  onAddLand,
  onExport,
}: {
  cards: Card[];
  /** Clicking a row calls this with one copy of that card removed from
   * the source list it represents (the caller decides what "moving" a
   * card means — to sideboard, back to list, etc.). Omit to make rows
   * non-interactive. */
  onRowClick?: (card: Card) => void;
  emptyMessage?: string;
  /** Show the Quick Add Land row above the list. Called with the land's
   * name when a button is clicked. Omit to hide the row entirely. */
  onAddLand?: (name: string) => void;
  /** Show an Export button below the list. Omit to hide it. */
  onExport?: () => void;
}) {
  const grouped = useMemo(() => groupCardsByName(cards.slice().reverse()), [cards]);

  return (
    <div className="flex flex-col h-full">
      {onAddLand && (
        <div className="flex justify-between items-center mb-1.5 bg-surface-container-high/40 rounded-lg px-2 py-1 border border-outline-variant/10">
          <span className="text-[10px] font-label-sm text-on-surface-variant uppercase">Quick Add Land</span>
          <div className="flex gap-1">
            {BASIC_LANDS.map((land) => (
              <button
                key={land.name}
                type="button"
                title={`Add a ${land.name}`}
                onClick={() => onAddLand(land.name)}
                className={`mana-symbol ${land.manaClass} m-0 hover:scale-110 transition-transform`}
              >
                {land.symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1">
        {cards.length === 0 ? (
          <p className="text-on-surface-variant text-body-md text-center py-md">{emptyMessage}</p>
        ) : (
          <div className="space-y-1">
            {grouped.map(({ card, count }) => (
              <PoolListRow
                key={card.name}
                card={card}
                count={count}
                onClick={onRowClick ? () => onRowClick(card) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className="w-full bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Export to Clipboard
        </button>
      )}
    </div>
  );
}

function PoolListRow({ card, count, onClick }: { card: Card; count: number; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [previewPos, setPreviewPos] = useState<{ top: number; left: number } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const colors = cardColors(card);

  function handleMouseEnter() {
    const rect = rowRef.current?.getBoundingClientRect();
    if (rect) {
      // Position the preview just to the left of the row, vertically
      // aligned with its top edge — same placement the old absolute-
      // positioned version aimed for, just computed in viewport
      // coordinates so a portal can render it outside the sidebar's
      // scrolling container (which otherwise clips anything that
      // crosses its edges, hiding the preview entirely).
      setPreviewPos({ top: rect.top, left: rect.left - 16 });
    }
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
  }

  return (
    <div
      ref={rowRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative flex items-center justify-between p-1.5 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-primary font-bold text-label-sm">{count}x</span>
        <span className="text-on-surface text-body-md">{card.name}</span>
      </div>
      <div className="flex gap-1">
        {colors.length > 0 ? (
          colors.map((c) => (
            <div
              key={c}
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${CARD_COLOR_BADGE[c]}`}
            >
              {c}
            </div>
          ))
        ) : (
          <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-[8px] font-bold text-white">
            C
          </div>
        )}
      </div>

      {hovered &&
        previewPos &&
        createPortal(
          <div
            className="fixed pointer-events-none z-50 w-48 aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl border border-primary/40"
            style={{ top: previewPos.top, left: previewPos.left, transform: 'translateX(-100%)' }}
          >
            <img className="w-full h-full object-cover" src={card.details.image_small} alt={card.name} />
          </div>,
          document.body
        )}
    </div>
  );
}

function PoolAnalytics({ cards }: { cards: Card[] }) {
  const curve = useMemo(() => {
    const buckets: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
    cards.forEach((c) => {
      buckets[cmcBucketFor(c.cmc)] += 1;
    });
    return buckets;
  }, [cards]);

  const maxCount = Math.max(1, ...Object.values(curve));

  const colorCounts = useMemo(() => {
    const counts: Record<ManaColor | 'C', number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    cards.forEach((c) => {
      const colors = cardColors(c);
      if (colors.length === 0) counts.C += 1;
      else colors.forEach((col) => (counts[col] += 1));
    });
    return counts;
  }, [cards]);

  if (cards.length === 0) {
    return <p className="text-on-surface-variant text-body-md text-center py-lg">Draft some cards to see analytics</p>;
  }

  return (
    <div className="space-y-lg">
      <div>
        <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">Mana Curve</h3>
        <div className="flex items-end gap-2 h-24">
          {Object.entries(curve).map(([bucket, count]) => (
            <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/60 rounded-t-md transition-all"
                style={{ height: `${(count / maxCount) * 80}px` }}
              />
              <span className="text-label-sm text-on-surface-variant">{bucket}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">Color Breakdown</h3>
        <div className="space-y-1.5">
          {(Object.entries(colorCounts) as [ManaColor | 'C', number][])
            .filter(([, count]) => count > 0)
            .map(([color, count]) => (
              <div key={color} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${color === 'C' ? 'bg-gray-600' : CARD_COLOR_BADGE[color]}`} />
                <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: `${(count / cards.length) * 100}%` }} />
                </div>
                <span className="text-label-sm text-on-surface-variant w-6 text-right">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
