import {
  COLOR_PIP_ACTIVE,
  COLOR_PIP_STYLES,
  TYPE_FILTERS,
  type CardFilterControls,
  type CmcBucket,
  type ManaColor,
} from '../model/cardFilters';
import { CollapsibleSection } from '../../../shared/components/CollapsibleSection';

export type FilterPanelProps = CardFilterControls & {
  /** Optional control rendered in the "Filters" header row (right side),
   * visible whether the panel is expanded or collapsed. */
  headerAccessory?: React.ReactNode;
};

function activeFilterCount(search: string, activeColors: ManaColor[], activeCmc: CmcBucket[], activeType: string[]): number {
  let n = 0;
  if (search) n++;
  n += activeColors.length;
  n += activeCmc.length;
  n += activeType.length;
  return n;
}

/**
 * The search/color/CMC/type filter bar used above the draft board's card
 * grid. Reusable wherever a filterable card list is needed.
 * Collapsed by default everywhere; compact when expanded so it takes up
 * as little vertical space as possible.
 */
export function FilterPanel({
  search,
  onSearchChange,
  activeColors,
  onToggleColor,
  activeCmc,
  onToggleCmc,
  activeType,
  onToggleType,
  headerAccessory,
}: FilterPanelProps) {
  const count = activeFilterCount(search, activeColors, activeCmc, activeType);

  return (
    <div className="mb-md">
      <CollapsibleSection
        title="Filters"
        icon="filter_list"
        defaultOpen={false}
        className="glass-panel rounded-2xl shadow-lg overflow-hidden"
        headerClassName="rounded-t-2xl"
        contentClassName="px-md pt-[5px] pb-[5px]"
        headerAccessory={headerAccessory}
        badge={
          count > 0 ? (
            <span className="bg-primary text-on-primary text-[11px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
              {count}
            </span>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-sm">
          {/* Row 1: search, colors, mana value */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg pl-8 pr-3 py-1.5 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none placeholder:text-on-surface-variant/50 transition-all"
                placeholder="Filter cards by name..."
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/20">
              {(['W', 'U', 'B', 'R', 'G', 'C'] as ManaColor[]).map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-[12px] border transition-all ${
                    activeColors.includes(color) ? COLOR_PIP_ACTIVE[color] : COLOR_PIP_STYLES[color]
                  }`}
                  onClick={() => onToggleColor(color)}
                  aria-pressed={activeColors.includes(color)}
                >
                  {color}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-label-sm text-on-surface-variant mr-0.5 uppercase tracking-widest text-[10px] hidden sm:inline">
                MV
              </span>
              {(['0', '1', '2', '3', '4', '5+'] as CmcBucket[]).map((bucket) => (
                <button
                  key={bucket}
                  className={`w-7 h-7 rounded-md text-[11px] border transition-all ${
                    activeCmc.includes(bucket)
                      ? 'bg-primary/20 text-primary border-primary/40 font-bold'
                      : 'bg-surface-container-high hover:bg-primary/20 border-outline-variant/20'
                  }`}
                  onClick={() => onToggleCmc(bucket)}
                  aria-pressed={activeCmc.includes(bucket)}
                >
                  {bucket}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: type filters */}
          <div className="flex flex-wrap gap-1.5 border-t border-outline-variant/10 pt-sm">
            {TYPE_FILTERS.map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full text-[11px] transition-colors font-medium border ${
                  activeType.includes(type)
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary/50'
                }`}
                onClick={() => onToggleType(type)}
                aria-pressed={activeType.includes(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
