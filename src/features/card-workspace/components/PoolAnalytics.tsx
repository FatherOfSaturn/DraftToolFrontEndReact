import { useMemo, useState } from 'react';
import type { Card } from '../../../shared/model/cardTypes';
import { CARD_COLOR_BADGE, cardColors, cmcBucketFor, TYPE_FILTERS, type ManaColor } from '../model/cardFilters';

const TYPE_CSS_COLORS: Record<string, string> = {
  Creature: '#ff6b6b',
  Instant: '#48dbfb',
  Sorcery: '#feca57',
  Artifact: '#a29bfe',
  Enchantment: '#ff9ff3',
  Land: '#54a0ff',
  Planeswalker: '#ff9f43',
  Battle: '#ee5a24',
  Other: '#8395a7',
};

const KNOWN_TYPES = TYPE_FILTERS.filter((t) => t !== 'Other');

function classifyType(typeLine: string): string {
  const lower = typeLine.toLowerCase();
  for (const t of KNOWN_TYPES) {
    if (lower.includes(t.toLowerCase())) return t;
  }
  return 'Other';
}

/** Convert polar (angle in degrees) to Cartesian on a unit circle. */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG path d-attribute for a pie slice from startAngle to endAngle. */
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (endAngle - startAngle >= 359.99) {
    // Full circle — two half-arcs
    const mid = startAngle + 180;
    const s = polarToCartesian(cx, cy, r, startAngle);
    const m = polarToCartesian(cx, cy, r, mid);
    return [
      `M ${s.x} ${s.y}`,
      `A ${r} ${r} 0 1 1 ${m.x} ${m.y}`,
      `A ${r} ${r} 0 1 1 ${s.x} ${s.y}`,
      `L ${cx} ${cy}`,
      'Z',
    ].join(' ');
  }
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

export function PoolAnalytics({ cards }: { cards: Card[] }) {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

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

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cards.forEach((card) => {
      const t = classifyType(card.type_line);
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [cards]);

  if (cards.length === 0) {
    return <p className="text-on-surface-variant text-body-md text-center py-lg">Draft some cards to see analytics</p>;
  }

  const maxCount = Math.max(1, ...Object.values(curve));
  const typeEntries = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);
  const total = cards.length;

  // SVG pie chart data
  const cx = 50, cy = 50, r = 45;
  let cumulativeAngle = 0;
  const slices = typeEntries.map(([type, count]) => {
    const startAngle = cumulativeAngle;
    const sweep = (count / total) * 360;
    cumulativeAngle += sweep;
    return { type, count, startAngle, endAngle: cumulativeAngle, sweep };
  });

  const hoveredSlice = hoveredType ? slices.find((s) => s.type === hoveredType) : null;

  return (
    <div className="space-y-lg">
      {/* Mana Curve */}
      <div>
        <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">Mana Curve</h3>
        <div className="flex items-end gap-2 h-24">
          {Object.entries(curve).map(([bucket, count]) => (
            <div key={bucket} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full bg-primary/60 rounded-t-md transition-all" style={{ height: `${(count / maxCount) * 80}px` }} />
              <span className="text-label-sm text-on-surface-variant">{bucket}</span>
              {count > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-container-high text-on-surface text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {count} card{count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Color Breakdown */}
      <div>
        <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">Color Breakdown</h3>
        <div className="space-y-1.5">
          {(Object.entries(colorCounts) as [ManaColor | 'C', number][]).filter(([, count]) => count > 0).map(([color, count]) => (
            <div key={color} className="flex items-center gap-2 group relative">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${color === 'C' ? 'bg-gray-600' : CARD_COLOR_BADGE[color]}`} />
              <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${(count / cards.length) * 100}%` }} />
              </div>
              <span className="text-label-sm text-on-surface-variant w-6 text-right">{count}</span>
              <div className="absolute -top-8 right-0 px-2 py-1 bg-surface-container-high text-on-surface text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {count} card{count !== 1 ? 's' : ''} ({((count / cards.length) * 100).toFixed(0)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Type Pie Chart */}
      <div>
        <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-sm">Type Breakdown</h3>
        <div className="flex items-center gap-lg">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              onMouseLeave={() => setHoveredType(null)}
            >
              {slices.map((slice) => (
                <path
                  key={slice.type}
                  d={arcPath(cx, cy, r, slice.startAngle, slice.endAngle)}
                  fill={TYPE_CSS_COLORS[slice.type] || TYPE_CSS_COLORS.Other}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={hoveredType === slice.type ? 2 : 0.5}
                  opacity={hoveredType && hoveredType !== slice.type ? 0.5 : 1}
                  className="transition-opacity duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredType(slice.type)}
                />
              ))}
            </svg>
            {/* Tooltip */}
            {hoveredSlice && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-2 bg-surface-container-high/95 backdrop-blur-sm text-on-surface text-xs rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 border border-outline-variant/30 font-label-md">
                {hoveredSlice.type}: {hoveredSlice.count}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            {typeEntries.map(([type, count]) => (
              <div
                key={type}
                className={`flex items-center gap-2 group relative transition-opacity duration-150 ${hoveredType && hoveredType !== type ? 'opacity-40' : ''}`}
                onMouseEnter={() => setHoveredType(type)}
                onMouseLeave={() => setHoveredType(null)}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_CSS_COLORS[type] || TYPE_CSS_COLORS.Other }} />
                <span className="text-label-sm text-on-surface-variant flex-1">{type}</span>
                <span className="text-label-sm text-on-surface-variant">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
