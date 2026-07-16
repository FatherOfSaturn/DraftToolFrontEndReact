import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BASIC_LANDS } from '../../../shared/lib/basicLands';
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

      {(onExport || onSaveDeck !== undefined) && (
        <div className="flex flex-col gap-1.5">
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

function PoolListRow({ card, count, onClick }: { card: Card; count: number; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [previewPos, setPreviewPos] = useState<{ top: number; left: number } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = cardColors(card);

  function handleMouseEnter() {
    hoverTimerRef.current = setTimeout(() => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) setPreviewPos({ top: rect.top, left: rect.left - 16 });
      setHovered(true);
    }, 150);
  }

  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    setHovered(false);
  }

  return (
    <div
      ref={rowRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative flex items-center justify-between p-1.5 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
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

      {hovered && previewPos && createPortal(
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
