import { useState, type MouseEvent } from 'react';
import { CARD_COLOR_BADGE, cardColors } from '../model/cardFilters';
import { useIsTouchDevice } from '../../../shared/hooks/useIsTouchDevice';
import type { Card } from '../../../shared/model/cardTypes';

export interface CardGridProps {
  cards: Card[];
  stagedCardID: string | null;
  onStage: (card: Card) => void;
  onDraftDirect?: (card: Card) => void;
  disabled: boolean;
  minSlots?: number;
}

export function CardGrid({ cards, stagedCardID, onStage, onDraftDirect, disabled, minSlots = 10 }: CardGridProps) {
  const placeholderCount = Math.max(0, minSlots - cards.length);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-md">
      {cards.map((card) => (
        <CardTile
          key={card.cardID}
          card={card}
          staged={stagedCardID === card.cardID}
          onStage={() => onStage(card)}
          onDraftDirect={onDraftDirect ? () => onDraftDirect(card) : undefined}
          disabled={disabled}
        />
      ))}
      {Array.from({ length: placeholderCount }).map((_, i) => (
        <EmptySlot key={`empty-${i}`} />
      ))}
    </div>
  );
}

export interface BurnCardGridProps {
  cards: Card[];
  /** IDs currently selected to draft. */
  selectedDraftIDs: string[];
  /** IDs currently selected to burn. */
  selectedBurnIDs: string[];
  /** Called when a card is clicked; the caller applies the active mode. */
  onSelect: (card: Card) => void;
  disabled: boolean;
  minSlots?: number;
}

/**
 * Multi-select variant of CardGrid used by the Burn Draft board. A card can be
 * selected to draft (primary outline + check) or to burn (red outline + flame).
 * The parent owns the mode toggle and selection state; this only renders it.
 */
export function BurnCardGrid({
  cards,
  selectedDraftIDs,
  selectedBurnIDs,
  onSelect,
  disabled,
  minSlots = 10,
}: BurnCardGridProps) {
  const placeholderCount = Math.max(0, minSlots - cards.length);
  const draftSet = new Set(selectedDraftIDs);
  const burnSet = new Set(selectedBurnIDs);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-md">
      {cards.map((card) => {
        const state: BurnSelectionState = burnSet.has(card.cardID)
          ? 'burn'
          : draftSet.has(card.cardID)
            ? 'draft'
            : 'none';
        return (
          <BurnCardTile
            key={card.cardID}
            card={card}
            state={state}
            onClick={() => onSelect(card)}
            disabled={disabled}
          />
        );
      })}
      {Array.from({ length: placeholderCount }).map((_, i) => (
        <EmptySlot key={`empty-${i}`} />
      ))}
    </div>
  );
}

type BurnSelectionState = 'none' | 'draft' | 'burn';

interface BurnCardTileProps {
  card: Card;
  state: BurnSelectionState;
  onClick: () => void;
  disabled: boolean;
}

function BurnCardTile({ card, state, onClick, disabled }: BurnCardTileProps) {
  const borderClass =
    state === 'burn'
      ? 'border-error shadow-[0_0_18px_rgba(239,68,68,0.55)]'
      : state === 'draft'
        ? 'border-primary shadow-[0_0_18px_var(--glow-primary-light-soft)]'
        : 'border-outline-variant/30 hover:border-primary/50';

  const badge =
    state === 'burn'
      ? { icon: 'local_fire_department', label: 'BURN', className: 'bg-error text-on-error' }
      : state === 'draft'
        ? { icon: 'check', label: 'DRAFT', className: 'bg-primary text-on-primary' }
        : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state !== 'none'}
      aria-label={
        state === 'burn'
          ? `${card.name} selected to burn`
          : state === 'draft'
            ? `${card.name} selected to draft`
            : `${card.name} — not selected`
      }
      className={`group relative aspect-[2.5/3.5] bg-surface-container rounded-xl overflow-hidden transition-all duration-200 flex flex-col border-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${borderClass}`}
    >
      <CardVisual card={card} />
      {badge && (
        <div
          className={`absolute top-2 left-2 rounded-full pl-1 pr-2 h-6 flex items-center gap-0.5 shadow-xl ${badge.className}`}
        >
          <span className="material-symbols-outlined text-[16px]">{badge.icon}</span>
          <span className="text-[10px] font-bold tracking-wide">{badge.label}</span>
        </div>
      )}
      {state === 'burn' && (
        <div className="absolute inset-0 bg-error/15 pointer-events-none z-10 rounded-xl" />
      )}
    </button>
  );
}

interface CardTileProps {
  card: Card;
  staged: boolean;
  onStage: () => void;
  onDraftDirect?: () => void;
  disabled: boolean;
}

function CardTile({ card, staged, onStage, onDraftDirect, disabled }: CardTileProps) {
  return (
    <button
      type="button"
      onClick={onStage}
      onDoubleClick={onDraftDirect}
      disabled={disabled}
      aria-pressed={staged}
      className={`group relative aspect-[2.5/3.5] bg-surface-container rounded-xl overflow-hidden transition-colors duration-300 flex flex-col border-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
          staged ? 'border-primary' : 'border-outline-variant/30'
      }`}
      >
      <div className="absolute inset-0 border-[1px] border-primary/0 group-hover:border-primary/40 rounded-xl pointer-events-none z-10 transition-colors duration-500" />
      <CardVisual card={card} />
      {staged && (
        <div className="absolute top-2 left-2 z-20 bg-primary text-on-primary rounded-full w-6 h-6 flex items-center justify-center shadow-xl">
          <span className="material-symbols-outlined text-[16px]">check</span>
        </div>
      )}
    </button>
  );
}

/**
 * The image, mana badges, and flip control shared by the single-pick
 * CardTile and the multi-select BurnCardTile.
 */
function CardVisual({ card }: { card: Card }) {
  const isTouch = useIsTouchDevice();
  const colors = cardColors(card);
  const [showingBack, setShowingBack] = useState(false);
  const hasFlipImage = Boolean(card.details.image_flip);
  const imageSrc = showingBack && hasFlipImage ? card.details.image_flip! : card.details.image_normal;

  function handleFlipClick(e: MouseEvent) {
    e.stopPropagation();
    if (!hasFlipImage) return;
    setShowingBack((prev) => !prev);
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        className="w-full h-full object-cover"
        src={imageSrc}
        alt={card.name}
      />
      <div className="absolute bottom-2 left-2 flex gap-1">
        {colors.length > 0 ? (
          colors.map((c) => (
            <div
              key={c}
              className={`w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-xl ${CARD_COLOR_BADGE[c]}`}
            >
              {c}
            </div>
          ))
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-600 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-xl">
            {card.cmc}
          </div>
        )}
      </div>
      {hasFlipImage && (
        <div
          className={`absolute inset-x-0 bottom-0 h-16 transition-opacity flex items-end justify-center p-md ${
            isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={handleFlipClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleFlipClick(e as unknown as MouseEvent);
            }}
            aria-label="Show card back"
            className={`material-symbols-outlined w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-on-primary cursor-pointer hover:brightness-110 ${
              isTouch ? '' : 'transform translate-y-4 group-hover:translate-y-0 transition-transform'
            }`}
          >
            flip_camera_android
          </span>
        </div>
      )}
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="aspect-[2.5/3.5] bg-surface-container-lowest/20 rounded-xl border border-dashed border-outline-variant/20 flex items-center justify-center text-outline-variant/40 group hover:border-primary/40 transition-colors">
      <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">style</span>
    </div>
  );
}
