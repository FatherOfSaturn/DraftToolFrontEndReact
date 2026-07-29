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
      <div className="relative glass-panel rounded-2xl p-lg flex flex-col items-center justify-center overflow-hidden min-h-[500px] md:min-h-[700px] arcane-glow">
        <div className="z-10 w-full mb-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm">
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

        <div className="z-10 flex flex-wrap justify-center gap-0 mt-md">
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
          <div className="absolute bottom-10 right-10 z-10 flex flex-col items-end">
            <button
              className="relative w-32 md:w-40 aspect-[5/7] group cursor-pointer hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
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

function HandCard({ card }: { card: ExpandedCard }) {
  return (
    <div
      className="group relative w-28 md:w-36 aspect-[5/7] bg-surface-container rounded-lg border border-primary/40 overflow-hidden transition-transform duration-500 hover:-translate-y-4 hover:scale-110"
    >
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20 flex items-center justify-center p-2">
          <span className="text-center text-[11px] font-label-sm text-on-surface-variant leading-tight">
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
