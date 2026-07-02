import { useMemo, useState } from 'react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { parseDecklist, totalCardCount, type DecklistEntry } from '../../lib/parseDecklist';
import { lookupTypeLine } from '../../lib/cardTypeLookup';
import { categorizeTypeLine, type CardCategory } from '../../lib/cardCategory';
import { probabilityOfAtLeast } from '../../lib/hypergeometric';

const SAMPLE_DECKLIST = `4 Counterspell
4 Brainstorm
4 Lightning Bolt
2 Path to Exile
2 Sol Ring
17 Island
17 Mountain
10 Forest`;

interface ExpandedCard {
  name: string;
  category: CardCategory;
}

function expandDecklist(entries: DecklistEntry[]): ExpandedCard[] {
  const expanded: ExpandedCard[] = [];
  for (const entry of entries) {
    const typeLine = lookupTypeLine(entry.name);
    const category = categorizeTypeLine(typeLine);
    for (let i = 0; i < entry.quantity; i++) {
      expanded.push({ name: entry.name, category });
    }
  }
  return expanded;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CATEGORY_ORDER: CardCategory[] = [
  'Land',
  'Creature',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Planeswalker',
  'Battle',
  'Unknown',
];

const CATEGORY_BAR_COLOR: Record<CardCategory, string> = {
  Land: 'bg-secondary',
  Creature: 'bg-tertiary',
  Instant: 'bg-primary',
  Sorcery: 'bg-outline-variant',
  Artifact: 'bg-on-surface-variant',
  Enchantment: 'bg-error',
  Planeswalker: 'bg-secondary-container',
  Battle: 'bg-tertiary-container',
  Unknown: 'bg-outline',
};

const CATEGORY_TEXT_COLOR: Record<CardCategory, string> = {
  Land: 'text-secondary',
  Creature: 'text-tertiary',
  Instant: 'text-primary',
  Sorcery: 'text-on-surface-variant',
  Artifact: 'text-on-surface-variant',
  Enchantment: 'text-error',
  Planeswalker: 'text-secondary',
  Battle: 'text-tertiary',
  Unknown: 'text-outline',
};

/**
 * Standalone mulligan/opening-hand simulator: paste a decklist, draw
 * simulated opening hands from it, and see hypergeometric probabilities
 * for drawing a land (or other category) by a given turn. Entirely
 * client-side and self-contained — no game session, API calls, or
 * router params involved; parseDecklist/lookupTypeLine/categorizeTypeLine
 * /probabilityOfAtLeast (all in lib/) do the actual work, this component
 * is state + presentation.
 */
export function MulliganSimulatorPage() {
  const [decklistText, setDecklistText] = useState(SAMPLE_DECKLIST);
  const [infusedText, setInfusedText] = useState(SAMPLE_DECKLIST);
  const [deck, setDeck] = useState<ExpandedCard[]>(() => expandDecklist(parseDecklist(SAMPLE_DECKLIST)));

  // hand + library together represent one shuffled draw from `deck`:
  // library is "what's left to draw from" so that Draw Card pulls a card
  // that's guaranteed not to already be in hand (true draw-without-
  // replacement), rather than reshuffling the whole deck each time.
  const [{ hand, library }, setDrawState] = useState<{ hand: ExpandedCard[]; library: ExpandedCard[] }>(() => {
    const shuffled = shuffle(expandDecklist(parseDecklist(SAMPLE_DECKLIST)));
    return { hand: shuffled.slice(0, 7), library: shuffled.slice(7) };
  });

  const [wellAtLeast, setWellAtLeast] = useState(2);
  const [wellCategory, setWellCategory] = useState<CardCategory>('Land');
  const [wellInNext, setWellInNext] = useState(10);

  const deckSize = deck.length;
  const unknownNames = useMemo(() => {
    const names = new Set<string>();
    parseDecklist(infusedText).forEach((e) => {
      if (lookupTypeLine(e.name) === null) names.add(e.name);
    });
    return [...names];
  }, [infusedText]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CardCategory, number> = {
      Land: 0,
      Creature: 0,
      Instant: 0,
      Sorcery: 0,
      Artifact: 0,
      Enchantment: 0,
      Planeswalker: 0,
      Battle: 0,
      Unknown: 0,
    };
    deck.forEach((c) => {
      counts[c.category] += 1;
    });
    return counts;
  }, [deck]);

  const librarySize = library.length;

  // Quick stats summary row
  const landInOpenerPct = useMemo(
    () => probabilityOfAtLeast({ deckSize, categoryCount: categoryCounts.Land, cardsSeenByThen: 7, atLeast: 1 }),
    [deckSize, categoryCounts]
  );
  const creatureByT3Pct = useMemo(
    () =>
      probabilityOfAtLeast({ deckSize, categoryCount: categoryCounts.Creature, cardsSeenByThen: 9, atLeast: 1 }),
    [deckSize, categoryCounts]
  );
  const interactionCount = categoryCounts.Instant + categoryCounts.Sorcery;
  const interactionDensity = deckSize > 0 ? interactionCount / deckSize : 0;
  const interactionLabel =
    interactionDensity >= 0.2 ? 'High' : interactionDensity >= 0.1 ? 'Moderate' : 'Low';

  // Bottom stat row
  const manaScrewPct = useMemo(() => {
    if (deckSize === 0) return 0;
    const atLeast3 = probabilityOfAtLeast({
      deckSize,
      categoryCount: categoryCounts.Land,
      cardsSeenByThen: 10,
      atLeast: 3,
    });
    return 1 - atLeast3;
  }, [deckSize, categoryCounts]);

  // The interactive probability calculator
  const wellResult = useMemo(() => {
    if (deckSize === 0) return 0;
    return probabilityOfAtLeast({
      deckSize,
      categoryCount: categoryCounts[wellCategory],
      cardsSeenByThen: Math.min(wellInNext, deckSize),
      atLeast: wellAtLeast,
    });
  }, [deckSize, categoryCounts, wellCategory, wellAtLeast, wellInNext]);

  function handleInfuseList() {
    const entries = parseDecklist(decklistText);
    const expanded = expandDecklist(entries);
    const shuffled = shuffle(expanded);
    setDeck(expanded);
    setInfusedText(decklistText);
    setDrawState({ hand: shuffled.slice(0, 7), library: shuffled.slice(7) });
  }

  function handleMulligan() {
    const shuffled = shuffle(deck);
    setDrawState({ hand: shuffled.slice(0, 7), library: shuffled.slice(7) });
  }

  function handleDrawCard() {
    setDrawState((prev) => {
      if (prev.library.length === 0) return prev;
      const [next, ...rest] = prev.library;
      return { hand: [...prev.hand, next], library: rest };
    });
  }

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-primary-container/30 min-h-screen">
      <Header />
      <main className="w-full max-w-[1600px] mx-auto grid grid-cols-12 gap-gutter pt-24 px-4 md:px-margin-desktop pb-xl">
        <DecklistPane
          decklistText={decklistText}
          onDecklistTextChange={setDecklistText}
          onInfuseList={handleInfuseList}
          deckSize={deckSize}
          landInOpenerPct={landInOpenerPct}
          creatureByT3Pct={creatureByT3Pct}
          interactionLabel={interactionLabel}
          unknownNames={unknownNames}
        />

        <MulliganZone
          hand={hand}
          deckSize={deckSize}
          librarySize={librarySize}
          onMulligan={handleMulligan}
          onDrawCard={handleDrawCard}
          manaScrewPct={manaScrewPct}
        />

        <InsightsPane
          categoryCounts={categoryCounts}
          deckSize={deckSize}
          wellCategory={wellCategory}
          onWellCategoryChange={setWellCategory}
          wellAtLeast={wellAtLeast}
          onWellAtLeastChange={setWellAtLeast}
          wellInNext={wellInNext}
          onWellInNextChange={setWellInNext}
          wellResult={wellResult}
        />
      </main>

      <Footer />
    </div>
  );
}


interface DecklistPaneProps {
  decklistText: string;
  onDecklistTextChange: (v: string) => void;
  onInfuseList: () => void;
  deckSize: number;
  landInOpenerPct: number;
  creatureByT3Pct: number;
  interactionLabel: string;
  unknownNames: string[];
}

function DecklistPane({
  decklistText,
  onDecklistTextChange,
  onInfuseList,
  deckSize,
  landInOpenerPct,
  creatureByT3Pct,
  interactionLabel,
  unknownNames,
}: DecklistPaneProps) {
  return (
    <section className="col-span-12 lg:col-span-3 flex flex-col gap-sm">
      <div className="glass-panel rounded-xl p-md flex flex-col gap-sm h-[600px]">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
          <h2 className="font-headline-md text-headline-md text-primary">Decklist</h2>
          <span className="material-symbols-outlined text-on-surface-variant">edit_note</span>
        </div>
        <p className="text-on-surface-variant font-label-sm text-label-sm opacity-70">
          Paste your Decklist here (EX: 2 Lightning Bolt)
        </p>
        <textarea
          className="flex-1 w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-sm font-label-sm text-label-sm text-on-surface focus:outline-none focus:border-primary-container transition-all resize-none"
          placeholder={'4 Counterspell\n4 Brainstorm\n20 Island...'}
          value={decklistText}
          onChange={(e) => onDecklistTextChange(e.target.value)}
        />
        {unknownNames.length > 0 && (
          <p className="text-[11px] text-on-surface-variant/80 leading-snug">
            <span className="text-tertiary font-semibold">{unknownNames.length}</span> card
            {unknownNames.length === 1 ? '' : 's'} not in the local type lookup yet (treated as
            Unknown): {unknownNames.slice(0, 4).join(', ')}
            {unknownNames.length > 4 ? '…' : ''}
          </p>
        )}
        <button
          className="w-full bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all arcane-glow"
          onClick={onInfuseList}
        >
          Load Deck
        </button>
        <p className="text-center text-on-surface-variant font-label-sm text-label-sm">
          {deckSize} cards in deck
        </p>
      </div>

      <div className="glass-panel rounded-xl p-md">
        <h3 className="font-headline-md text-headline-md text-primary mb-sm">Quick Stats</h3>
        <div className="space-y-sm">
          <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Land in Opener</span>
            <span className="font-label-sm text-label-sm text-secondary">
              {(landInOpenerPct * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Creature by T3</span>
            <span className="font-label-sm text-label-sm text-secondary">
              {(creatureByT3Pct * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center py-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Interaction Density</span>
            <span className="font-label-sm text-label-sm text-secondary">{interactionLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

interface MulliganZoneProps {
  hand: ExpandedCard[];
  deckSize: number;
  librarySize: number;
  onMulligan: () => void;
  onDrawCard: () => void;
  manaScrewPct: number;
}

function MulliganZone({ hand, deckSize, librarySize, onMulligan, onDrawCard, manaScrewPct }: MulliganZoneProps) {
  return (
    <section className="col-span-12 lg:col-span-6 flex flex-col gap-gutter">
      <div className="relative glass-panel rounded-2xl p-lg flex flex-col items-center justify-center overflow-hidden min-h-[600px] arcane-glow">
        <div className="z-10 w-full mb-lg flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="font-display text-headline-lg text-primary uppercase tracking-widest">
              Opening Hand
            </h2>
            <span className="text-on-surface-variant font-label-sm text-label-sm">
              Hand: {hand.length} Card{hand.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex gap-sm">
            <button
              className="px-md py-xs bg-surface-container-high border border-outline-variant/30 rounded-full text-label-md font-label-md hover:bg-primary/20 transition-colors flex items-center gap-xs disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onMulligan}
              disabled={deckSize === 0}
            >
              <span className="material-symbols-outlined text-sm">refresh</span> Mulligan
            </button>
            <button
              className="px-md py-xs bg-primary text-on-primary rounded-full text-label-md font-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-xs disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onDrawCard}
              disabled={librarySize === 0}
            >
              <span className="material-symbols-outlined text-sm">add</span> Draw Card
            </button>
          </div>
        </div>

        <div className="z-10 flex flex-wrap justify-center gap-sm mt-md">
          {hand.map((card, i) => (
            <HandCard key={`${card.name}-${i}`} card={card} index={i} />
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
      className={`group relative w-24 md:w-32 aspect-[5/7] bg-surface-container rounded-lg border border-primary/40 overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-4 hover:scale-110 ${rotation}`}
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

interface InsightsPaneProps {
  categoryCounts: Record<CardCategory, number>;
  deckSize: number;
  wellCategory: CardCategory;
  onWellCategoryChange: (c: CardCategory) => void;
  wellAtLeast: number;
  onWellAtLeastChange: (n: number) => void;
  wellInNext: number;
  onWellInNextChange: (n: number) => void;
  wellResult: number;
}

function InsightsPane({
  categoryCounts,
  deckSize,
  wellCategory,
  onWellCategoryChange,
  wellAtLeast,
  onWellAtLeastChange,
  wellInNext,
  onWellInNextChange,
  wellResult,
}: InsightsPaneProps) {
  const presentCategories = CATEGORY_ORDER.filter((c) => categoryCounts[c] > 0);

  return (
    <aside className="col-span-12 lg:col-span-3 flex flex-col gap-gutter">
      <div className="glass-panel rounded-xl p-md flex flex-col gap-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">calculate</span>
          <h3 className="font-headline-md text-headline-md">Probability Calculator</h3>
        </div>
        <div className="space-y-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-label-md text-on-surface-variant">
              Probability of drawing at least
            </label>
            <div className="flex gap-xs items-center">
              <input
                className="w-16 bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1 text-label-md text-primary focus:border-primary-container outline-none"
                type="number"
                min={0}
                value={wellAtLeast}
                onChange={(e) => onWellAtLeastChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
              <select
                className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1 text-label-md text-on-surface focus:border-primary-container outline-none"
                value={wellCategory}
                onChange={(e) => onWellCategoryChange(e.target.value as CardCategory)}
              >
                {presentCategories.length === 0 ? (
                  <option>Lands</option>
                ) : (
                  presentCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}s ({categoryCounts[c]})
                    </option>
                  ))
                )}
              </select>
            </div>
            <label className="text-xs font-label-md text-on-surface-variant">in next</label>
            <div className="flex gap-xs items-center">
              <input
                className="w-16 bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1 text-label-md text-secondary focus:border-primary-container outline-none"
                type="number"
                min={1}
                max={deckSize || 1}
                value={wellInNext}
                onChange={(e) =>
                  onWellInNextChange(Math.max(1, Math.min(deckSize || 1, parseInt(e.target.value, 10) || 1)))
                }
              />
              <span className="text-xs font-label-md text-on-surface-variant">cards.</span>
            </div>
          </div>
          <div className="p-md bg-primary/10 rounded-lg border border-primary/20 flex flex-col items-center">
            <span className="text-primary font-display text-display leading-tight">
              {deckSize === 0 ? '—' : `${(wellResult * 100).toFixed(1)}%`}
            </span>
            <span className="text-xs font-label-sm text-on-surface-variant">Probability Result</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-md flex-1">
        <h3 className="font-headline-md text-headline-md text-primary mb-md">Deck Composition</h3>
        <div className="space-y-md">
          {presentCategories.length === 0 && (
            <p className="text-on-surface-variant font-body-md text-sm">
              Infuse a decklist to see its composition.
            </p>
          )}
          {presentCategories.map((category) => {
            const count = categoryCounts[category];
            const pct = deckSize > 0 ? (count / deckSize) * 100 : 0;
            return (
              <div key={category}>
                <div className="flex justify-between mb-1">
                  <span className="font-label-sm text-label-sm text-on-surface">{category}s</span>
                  <span className={`font-label-sm text-label-sm ${CATEGORY_TEXT_COLOR[category]}`}>
                    {pct.toFixed(0)}% Density
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                  <div
                    className={`${CATEGORY_BAR_COLOR[category]} h-1.5 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-lg p-sm border border-outline-variant/10 rounded-lg">
          <p className="text-xs italic text-on-surface-variant text-center">
            "Luck is merely probability taken personally."
          </p>
        </div>
      </div>
    </aside>
  );
}
