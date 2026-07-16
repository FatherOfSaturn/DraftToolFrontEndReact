import { useMemo } from 'react';
import type { Card } from '../../../shared/model/cardTypes';
import { CARD_COLOR_BADGE, cardColors, cmcBucketFor, type ManaColor } from '../model/cardFilters';

export function PoolAnalytics({ cards }: { cards: Card[] }) {
  const curve = useMemo(() => {
    const buckets: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
    cards.forEach((card) => { buckets[cmcBucketFor(card.cmc)] += 1; });
    return buckets;
  }, [cards]);

  const colorCounts = useMemo(() => {
    const counts: Record<ManaColor | 'C', number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    cards.forEach((card) => {
      const colors = cardColors(card);
      if (colors.length === 0) counts.C += 1;
      else colors.forEach((color) => { counts[color] += 1; });
    });
    return counts;
  }, [cards]);

  if (cards.length === 0) {
    return <p className="text-on-surface-variant text-body-md text-center py-lg">Draft some cards to see analytics</p>;
  }

  const maxCount = Math.max(1, ...Object.values(curve));
  return (
    <div className="space-y-lg">
      <div>
        <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">Mana Curve</h3>
        <div className="flex items-end gap-2 h-24">
          {Object.entries(curve).map(([bucket, count]) => (
            <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/60 rounded-t-md transition-all" style={{ height: `${(count / maxCount) * 80}px` }} />
              <span className="text-label-sm text-on-surface-variant">{bucket}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">Color Breakdown</h3>
        <div className="space-y-1.5">
          {(Object.entries(colorCounts) as [ManaColor | 'C', number][]).filter(([, count]) => count > 0).map(([color, count]) => (
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
