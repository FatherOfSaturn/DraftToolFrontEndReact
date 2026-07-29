import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BASIC_LANDS } from '../../../shared/lib/basicLands';
import { useIsTouchDevice } from '../../../shared/hooks/useIsTouchDevice';
import type { Card } from '../../../shared/model/cardTypes';
import { CARD_COLOR_BADGE, cardColors } from '../model/cardFilters';

interface PoolListProps {
  cards: Card[];
  onRowClick?: (card: Card) => void;
  emptyMessage?: string;
  onAddLand?: (name: string) => void;
  onExport?: () => void;
  onSaveDeck?: () => void;
}

interface GroupedCard {
  card: Card;
  count: number;
}

function groupCardsByName(cards: Card[]): GroupedCard[] {
  const groups = new Map<string, GroupedCard>();
  for (const card of cards) {
    const existing = groups.get(card.name);
    if (existing) existing.count += 1;
    else groups.set(card.name, { card, count: 1 });
  }
  return [...groups.values()];
}

export function PoolList({
  cards,
  onRowClick,
  emptyMessage = 'No cards drafted yet',
  onAddLand,
  onExport,
  onSaveDeck,
}: PoolListProps) {
  const grouped = useMemo(() => groupCardsByName(cards.slice().reverse()), [cards]);
  const [previewedCard, setPreviewedCard] = useState<string | null>(null);
  const [previewPos, setPreviewPos] = useState<{ top: number; left: number } | null>(null);

  function dismissPreview() {
    setPreviewedCard(null);
    setPreviewPos(null);
  }

  function showPreview(name: string, pos: { top: number; left: number }) {
    setPreviewPos(pos);
    setPreviewedCard(name);
  }

  useEffect(() => {
    if (!previewedCard) return;
    function handleTouch(e: TouchEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-pool-list]')) {
        dismissPreview();
      }
    }
    document.addEventListener('touchstart', handleTouch, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouch);
  }, [previewedCard]);

  return (
    <div className="flex flex-col h-full" data-pool-list>
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
                className="w-8 h-11 rounded overflow-hidden border border-outline-variant/20 hover:scale-110 hover:border-primary/40 transition-all shrink-0"
              >
                <img src={land.imageUrl} alt={land.name} className="w-full h-full object-cover" loading="lazy" />
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
                isPreviewed={previewedCard === card.name}
                previewPos={previewedCard === card.name ? previewPos : null}
                onShowPreview={(pos) => showPreview(card.name, pos)}
                onDismissPreview={dismissPreview}
              />
            ))}
          </div>
        )}
      </div>

      {(onExport || onSaveDeck !== undefined) && (
        <div className="sticky bottom-0 -mx-md px-md pb-[calc(var(--spacing-sm,8px)+env(safe-area-inset-bottom,0px))] pt-sm bg-surface-container-high/95 backdrop-blur-sm border-t border-outline-variant/10 flex flex-col gap-1.5">
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="w-full bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Export to Clipboard
            </button>
          )}
          <div className="relative group/tooltip">
            <button
              type="button"
              onClick={onSaveDeck}
              disabled={!onSaveDeck}
              className="w-full bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              Save Deck
            </button>
            {!onSaveDeck && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface-container-high text-on-surface text-label-sm rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-outline-variant/30 shadow-lg z-50">
                To save decks, log in
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PoolListRowProps {
  card: Card;
  count: number;
  onClick?: () => void;
  isPreviewed: boolean;
  previewPos: { top: number; left: number } | null;
  onShowPreview: (pos: { top: number; left: number }) => void;
  onDismissPreview: () => void;
}

function PoolListRow({ card, count, onClick, isPreviewed, previewPos, onShowPreview, onDismissPreview }: PoolListRowProps) {
  const isTouch = useIsTouchDevice();
  const [hovered, setHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = cardColors(card);

  function handleMouseEnter() {
    if (isTouch) return;
    hoverTimerRef.current = setTimeout(() => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        setHoverPos({ top: rect.top, left: rect.left - 16 });
        setHovered(true);
      }
    }, 150);
  }

  function handleMouseLeave() {
    if (isTouch) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    setHovered(false);
  }

  function handleTouchStart() {
    if (!isTouch) return;
    if (isPreviewed) {
      onDismissPreview();
      onClick?.();
      return;
    }
    const rect = rowRef.current?.getBoundingClientRect();
    if (rect) {
      onShowPreview({
        top: Math.min(rect.top, window.innerHeight - 320),
        left: Math.min(rect.left, window.innerWidth - 200),
      });
    }
  }

  const showPreview = isTouch ? isPreviewed : hovered;
  const activePos = isTouch ? previewPos : hoverPos;

  return (
    <div
      ref={rowRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onClick={() => { if (!isTouch) onClick?.(); }}
      className={`relative flex items-center justify-between p-1.5 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors ${onClick && !isTouch ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-primary font-bold text-label-sm">{count}x</span>
        <span className="text-on-surface text-body-md">{card.name}</span>
      </div>
      <div className="flex gap-1">
        {colors.length > 0 ? colors.map((color) => (
          <div
            key={color}
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${CARD_COLOR_BADGE[color]}`}
          >
            {color}
          </div>
        )) : (
          <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-[8px] font-bold text-white">C</div>
        )}
      </div>

      {showPreview && activePos && createPortal(
          <div
            className="fixed pointer-events-none z-[100] w-44 aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl border border-primary/40"
            style={{
              top: isTouch ? '50%' : activePos.top,
              left: isTouch ? '50%' : activePos.left,
              transform: isTouch ? 'translate(-50%, -50%)' : 'translateX(-100%)',
            }}
          >
            <img className="w-full h-full object-cover" src={card.details.image_small} alt={card.name} />
          </div>,
        document.body
      )}
    </div>
  );
}
