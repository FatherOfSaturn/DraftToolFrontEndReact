import { useState, type MouseEvent } from 'react';
import { CARD_COLOR_BADGE, cardColors } from './cardHelpers';
import type { Card } from '../../types';

export interface CardGridProps {
  cards: Card[];
  stagedCardID: string | null;
  onStage: (card: Card) => void;
  disabled: boolean;
  /** Pads the grid out to this many total tiles with dashed empty
   * slots, matching the original mockup's behavior when a pack has
   * fewer cards than a full grid row/page. */
  minSlots?: number;
}

/**
 * The responsive grid of draftable cards. Click a card to stage it for
 * picking (click again to unstage) — the small corner button flips the
 * card to show its back face, for double-faced cards, and is greyed out
 * if the card has no back face. Reusable wherever a card pool needs
 * this interaction — currently just the draft board, but written
 * generically enough to reuse for a future deck builder's card pool view.
 */
export function CardGrid({ cards, stagedCardID, onStage, disabled, minSlots = 10 }: CardGridProps) {
  const placeholderCount = Math.max(0, minSlots - cards.length);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-md">
      {cards.map((card) => (
        <CardTile
          key={card.cardID}
          card={card}
          staged={stagedCardID === card.cardID}
          onStage={() => onStage(card)}
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
  disabled: boolean;
}

function CardTile({ card, staged, onStage, disabled }: CardTileProps) {
  const colors = cardColors(card);
  const [showingBack, setShowingBack] = useState(false);
  const hasFlipImage = Boolean(card.details.image_flip);
  const imageSrc = showingBack && hasFlipImage ? card.details.image_flip! : card.details.image_normal;

  function handleFlipClick(e: MouseEvent) {
    // Stop the click from bubbling up to the tile's own onClick, which
    // would stage/unstage the card — flipping the image and staging the
    // card are two separate actions and shouldn't trigger each other.
    e.stopPropagation();
    if (!hasFlipImage) return;
    setShowingBack((prev) => !prev);
  }

  return (
    <button
      type="button"
      onClick={onStage}
      disabled={disabled}
      aria-pressed={staged}
      className={`group relative aspect-[2.5/3.5] bg-surface-container rounded-xl overflow-hidden transition-all duration-500 flex flex-col border text-left disabled:cursor-not-allowed disabled:opacity-60 ${
        staged ? 'border-primary shadow-[0_0_30px_rgba(169,116,255,0.8)]' : 'border-outline-variant/30'
      }`}
    >
      <div className="absolute inset-0 border-[1px] border-primary/0 group-hover:border-primary/40 rounded-xl pointer-events-none z-10 transition-all duration-500" />
      <div className="relative w-full h-full overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src={imageSrc}
          alt={card.name}
        />
        <div className="absolute top-2 right-2 flex gap-1">
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
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-md">
          <span
            role="button"
            tabIndex={hasFlipImage ? 0 : -1}
            onClick={handleFlipClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleFlipClick(e as unknown as MouseEvent);
            }}
            aria-label={hasFlipImage ? 'Show card back' : 'No card back available'}
            aria-disabled={!hasFlipImage}
            className={`material-symbols-outlined w-9 h-9 rounded-lg shadow-xl flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform ${
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
