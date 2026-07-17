import type { CardCategory } from '../../../shared/lib/cardCategory';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery';
import { CollapsibleSection } from '../../../shared/components/CollapsibleSection';

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

interface InsightsPaneProps {
  categoryCounts: Record<CardCategory, number>;
  deckSize: number;
  wellCategory: CardCategory;
  onWellCategoryChange: (category: CardCategory) => void;
  wellAtLeast: number;
  onWellAtLeastChange: (value: number) => void;
  wellInNext: number;
  onWellInNextChange: (value: number) => void;
  wellResult: number;
}

export function InsightsPane({
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
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const presentCategories = CATEGORY_ORDER.filter((category) => categoryCounts[category] > 0);

  return (
    <aside className="col-span-12 lg:col-span-3 flex flex-col gap-gutter">
      <div className="glass-panel rounded-xl overflow-hidden">
        <CollapsibleSection
          title="Probability Calculator"
          icon="calculate"
          defaultOpen={isDesktop}
          contentClassName="px-md pb-md"
        >
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
                  onChange={(event) => onWellAtLeastChange(Math.max(0, parseInt(event.target.value, 10) || 0))}
                />
                <select
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1 text-label-md text-on-surface focus:border-primary-container outline-none"
                  value={wellCategory}
                  onChange={(event) => onWellCategoryChange(event.target.value as CardCategory)}
                >
                  {presentCategories.length === 0 ? (
                    <option>Lands</option>
                  ) : (
                    presentCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}s ({categoryCounts[category]})
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
                  onChange={(event) =>
                    onWellInNextChange(Math.max(1, Math.min(deckSize || 1, parseInt(event.target.value, 10) || 1)))
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
        </CollapsibleSection>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden flex-1">
        <CollapsibleSection
          title="Deck Composition"
          icon="donut_large"
          defaultOpen={isDesktop}
          contentClassName="px-md pb-md"
        >
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
        </CollapsibleSection>
      </div>
    </aside>
  );
}
