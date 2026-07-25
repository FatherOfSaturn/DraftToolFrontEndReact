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

interface CardTileProps {
  card: Card;
  staged: boolean;
  onStage: () => void;
  onDraftDirect?: () => void;
  disabled: boolean;
}

function CardTile({ card, staged, onStage, onDraftDirect, disabled }: CardTileProps) {
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
        {staged && (
          <div className="absolute top-2 left-2 bg-primary text-on-primary rounded-full w-6 h-6 flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-[16px]">check</span>
          </div>
        )}
        <div
          className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent transition-opacity flex items-end justify-end p-md ${
            isTouch ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <span
            role="button"
            tabIndex={hasFlipImage ? 0 : -1}
            onClick={handleFlipClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleFlipClick(e as unknown as MouseEvent);
            }}
            aria-label={hasFlipImage ? 'Show card back' : 'No card back available'}
            aria-disabled={!hasFlipImage}
            className={`material-symbols-outlined w-9 h-9 rounded-lg shadow-xl flex items-center justify-center ${
              isTouch ? '' : 'transform translate-y-4 group-hover:translate-y-0 transition-transform'
            } ${
              hasFlipImage
                ? 'bg-primary text-on-primary cursor-pointer hover:brightness-110'
                : 'bg-surface-variant text-on-surface-variant/40 cursor-not-allowed'
            }`}
          >
            flip_camera_android
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptySlot() {
  return (
    <div className="aspect-[2.5/3.5] bg-surface-container-lowest/20 rounded-xl border border-dashed border-outline-variant/20 flex items-center justify-center text-outline-variant/40 group hover:border-primary/40 transition-colors">
      <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">style</span>
    </div>
  );
}
