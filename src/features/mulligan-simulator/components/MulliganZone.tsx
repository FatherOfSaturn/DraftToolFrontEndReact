import { useState } from 'react';
import type { CardCategory } from '../../../shared/lib/cardCategory';
import type { ExpandedCard } from '../model/mulliganUtils';

const CATEGORY_ORDER: CardCategory[] = [
  'Land', 'Creature', 'Instant', 'Sorcery', 'Artifact',
  'Enchantment', 'Planeswalker', 'Battle', 'Unknown',
];

const PIE_COLORS: Record<CardCategory, string> = {
  Land: '#54a0ff',
  Creature: '#ff6b6b',
  Instant: '#48dbfb',
  Sorcery: '#feca57',
  Artifact: '#a29bfe',
  Enchantment: '#ff9ff3',
  Planeswalker: '#ff9f43',
  Battle: '#ee5a24',
  Unknown: '#8395a7',
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (endAngle - startAngle >= 359.99) {
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

interface MulliganZoneProps {
  hand: ExpandedCard[];
  deckSize: number;
  librarySize: number;
  onMulligan: () => void;
  onDrawCard: () => void;
  manaScrewPct: number;
  avgCardCost: number;
  categoryCounts: Record<CardCategory, number>;
}

export function MulliganZone({ hand, deckSize, librarySize, onMulligan, onDrawCard, manaScrewPct, avgCardCost, categoryCounts }: MulliganZoneProps) {
  const [hoveredType, setHoveredType] = useState<CardCategory | null>(null);

  const presentCategories = CATEGORY_ORDER.filter((cat) => categoryCounts[cat] > 0);
  const total = deckSize;
  const cx = 50, cy = 50, r = 42;
  let cumulativeAngle = 0;
  const slices = presentCategories.map((type) => {
    const startAngle = cumulativeAngle;
    const sweep = total > 0 ? (categoryCounts[type] / total) * 360 : 0;
    cumulativeAngle += sweep;
    return { type, startAngle, endAngle: cumulativeAngle, sweep };
  });
  const hoveredSlice = hoveredType ? slices.find((s) => s.type === hoveredType) : null;

  return (
    <section className="col-span-12 lg:col-span-6 flex flex-col gap-gutter">
      <div className="relative glass-panel rounded-2xl p-md flex flex-col items-center overflow-hidden min-h-[400px] md:min-h-[500px] arcane-glow">
        <div className="z-10 w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm">
          <h2 className="font-display text-headline-md sm:text-headline-lg text-primary uppercase tracking-widest flex items-center gap-sm whitespace-nowrap">
            Opening Hand
            <span className="text-on-surface-variant font-label-sm text-label-sm normal-case tracking-normal">
              — {hand.length} Card{hand.length === 1 ? '' : 's'}
            </span>
          </h2>
          <button
            className="px-md py-xs bg-primary text-on-primary rounded-full text-label-md font-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onMulligan}
            disabled={deckSize === 0}
          >
            <span className="material-symbols-outlined text-sm">refresh</span> Mulligan
          </button>
        </div>

        <div className="z-10 flex flex-wrap justify-center gap-0 mt-1">
          {hand.map((card, index) => (
            <HandCard key={`${card.name}-${index}`} card={card} />
          ))}
          {hand.length === 0 && (
            <p className="text-on-surface-variant font-body-md py-xl">
              Paste a decklist and hit "Load Deck" to draw an opening hand.
            </p>
          )}
        </div>

        {deckSize > 0 && (
          <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end">
            <button
              className="relative w-24 md:w-32 aspect-[5/7] group cursor-pointer hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onDrawCard}
              disabled={librarySize === 0}
            >
              <div className="absolute top-2 left-2 w-full h-full bg-outline-variant rounded-lg border border-outline-variant/30 translate-x-2 translate-y-2 opacity-30" />
              <div className="absolute top-1 left-1 w-full h-full bg-outline-variant rounded-lg border border-outline-variant/30 translate-x-1 translate-y-1 opacity-60" />
              <div className="relative w-full h-full rounded-lg border-2 border-primary/60 overflow-hidden shadow-2xl bg-gradient-to-br from-primary-container/40 to-surface-container flex items-end">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-xs">
                  <span className="font-label-md text-label-md text-primary text-center">
                    Library ({librarySize})
                  </span>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <StatCard
          label="Avg. Card Cost"
          value={avgCardCost > 0 ? avgCardCost.toFixed(1) : '—'}
          valueColor="text-secondary"
          hint="Excluding lands"
        />
        <StatCard
          label="Mana Screw %"
          value={`${(manaScrewPct * 100).toFixed(1)}%`}
          valueColor="text-error"
          hint="Draws < 3 lands in 10 cards"
        />
        <div className="glass-panel rounded-xl p-md flex flex-col gap-xs border-primary/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-tighter">
            Type Breakdown
          </span>
          <div className="flex items-center gap-2">
            <div className="relative w-16 h-16 shrink-0">
              {total > 0 && (
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  onMouseLeave={() => setHoveredType(null)}
                >
                  {slices.map((slice) => (
                    <path
                      key={slice.type}
                      d={arcPath(cx, cy, r, slice.startAngle, slice.endAngle)}
                      fill={PIE_COLORS[slice.type]}
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth={hoveredType === slice.type ? 2 : 0.5}
                      opacity={hoveredType && hoveredType !== slice.type ? 0.5 : 1}
                      className="transition-opacity duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredType(slice.type)}
                    />
                  ))}
                </svg>
              )}
              {hoveredSlice && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-surface-container-high/95 backdrop-blur-sm text-on-surface text-[10px] rounded shadow-xl pointer-events-none whitespace-nowrap z-20 border border-outline-variant/30 font-label-md">
                  {hoveredSlice.type}: {categoryCounts[hoveredSlice.type]}
                </div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
              {presentCategories.map((type) => (
                <div
                  key={type}
                  className={`flex items-center gap-1 transition-opacity duration-150 ${hoveredType && hoveredType !== type ? 'opacity-40' : ''}`}
                  onMouseEnter={() => setHoveredType(type)}
                  onMouseLeave={() => setHoveredType(null)}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[type] }} />
                  <span className="text-[10px] text-on-surface-variant leading-tight truncate">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HandCard({ card }: { card: ExpandedCard }) {
  return (
    <div className="group relative w-24 md:w-32 aspect-[5/7] bg-surface-container rounded-lg border border-primary/40 overflow-hidden transition-transform duration-500 hover:-translate-y-4 hover:scale-110">
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20 flex items-center justify-center p-2">
          <span className="text-center text-[10px] font-label-sm text-on-surface-variant leading-tight">
            {card.name}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  valueColor: string;
  hint: string;
  highlighted?: boolean;
}

function StatCard({ label, value, valueColor, hint, highlighted }: StatCardProps) {
  return (
    <div className={`glass-panel rounded-xl p-md flex flex-col gap-xs ${highlighted ? 'border-primary/30' : ''}`}>
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-tighter">
        {label}
      </span>
      <span className={`font-display text-headline-lg ${valueColor}`}>{value}</span>
      <span className="text-xs text-on-surface-variant font-body-md">{hint}</span>
    </div>
  );
}
