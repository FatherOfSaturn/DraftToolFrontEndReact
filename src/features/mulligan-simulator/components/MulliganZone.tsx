import type { ExpandedCard } from '../model/mulliganUtils';

interface MulliganZoneProps {
  hand: ExpandedCard[];
  deckSize: number;
  librarySize: number;
  onMulligan: () => void;
  onDrawCard: () => void;
  manaScrewPct: number;
}

export function MulliganZone({ hand, deckSize, librarySize, onMulligan, onDrawCard, manaScrewPct }: MulliganZoneProps) {
  return (
    <section className="col-span-12 lg:col-span-6 flex flex-col gap-gutter">
      <div className="relative glass-panel rounded-2xl p-lg flex flex-col items-center justify-center overflow-hidden min-h-[400px] md:min-h-[600px] arcane-glow">
        <div className="z-10 w-full mb-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm">
          <div className="flex flex-col">
            <h2 className="font-display text-headline-md sm:text-headline-lg text-primary uppercase tracking-widest">
              Opening Hand
            </h2>
            <span className="text-on-surface-variant font-label-sm text-label-sm">
              Hand: {hand.length} Card{hand.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex gap-sm">
            <button
              className="px-md py-xs bg-surface-container-high border border-outline-variant/30 rounded-full text-label-md font-label-md hover:bg-primary/20 transition-colors flex items-center gap-xs min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onMulligan}
              disabled={deckSize === 0}
            >
              <span className="material-symbols-outlined text-sm">refresh</span> Mulligan
            </button>
            <button
              className="px-md py-xs bg-primary text-on-primary rounded-full text-label-md font-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onDrawCard}
              disabled={librarySize === 0}
            >
              <span className="material-symbols-outlined text-sm">add</span> Draw Card
            </button>
          </div>
        </div>

        <div className="z-10 flex flex-wrap justify-center gap-sm mt-md">
          {hand.map((card, index) => (
            <HandCard key={`${card.name}-${index}`} card={card} index={index} />
          ))}
          {hand.length === 0 && (
            <p className="text-on-surface-variant font-body-md py-xl">
              Paste a decklist and hit "Load Deck" to draw an opening hand.
            </p>
          )}
        </div>

        {deckSize > 0 && (
          <div className="absolute bottom-10 right-10 z-10 flex flex-col items-end">
            <div className="relative w-28 md:w-36 aspect-[5/7] group">
              <div className="absolute top-2 left-2 w-full h-full bg-outline-variant rounded-lg border border-outline-variant/30 translate-x-2 translate-y-2 opacity-30" />
              <div className="absolute top-1 left-1 w-full h-full bg-outline-variant rounded-lg border border-outline-variant/30 translate-x-1 translate-y-1 opacity-60" />
              <div className="relative w-full h-full rounded-lg border-2 border-primary/60 overflow-hidden shadow-2xl bg-gradient-to-br from-primary-container/40 to-surface-container flex items-end">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-xs">
                  <span className="font-label-md text-label-md text-primary text-center">
                    Library ({librarySize})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <StatCard label="Goldfish Win" value="T4.2" valueColor="text-secondary" hint="Avg. speed over 1k sims" />
        <StatCard
          label="Mana Screw %"
          value={`${(manaScrewPct * 100).toFixed(1)}%`}
          valueColor="text-error"
          hint="Draws < 3 lands in 10 cards"
        />
        <StatCard
          label="Combo Stability"
          value="A-"
          valueColor="text-primary"
          hint="Consistency Score"
          highlighted
        />
      </div>
    </section>
  );
}

function HandCard({ card, index }: { card: ExpandedCard; index: number }) {
  const rotations = ['-rotate-2', '-rotate-1', 'rotate-0', 'rotate-1', 'rotate-2'];
  const rotation = rotations[index % rotations.length];
  return (
    <div
      className={`group relative w-24 md:w-32 aspect-[5/7] bg-surface-container rounded-lg border border-primary/40 overflow-hidden transition-transform duration-500 hover:-translate-y-4 hover:scale-110 ${rotation}`}
    >
      <div className="w-full h-full bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20 flex items-center justify-center p-2">
        <span className="text-center text-[11px] font-label-sm text-on-surface-variant leading-tight">
          {card.name}
        </span>
      </div>
      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-surface-dim/80 text-[9px] font-label-sm uppercase tracking-wide text-primary">
        {card.category}
      </div>
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
    <div
      className={`glass-panel rounded-xl p-md flex flex-col gap-xs ${highlighted ? 'border-primary/30' : ''}`}
    >
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-tighter">
        {label}
      </span>
      <span className={`font-display text-headline-lg ${valueColor}`}>{value}</span>
      <span className="text-xs text-on-surface-variant font-body-md">{hint}</span>
    </div>
  );
}
