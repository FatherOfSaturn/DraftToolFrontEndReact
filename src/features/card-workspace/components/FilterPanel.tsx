import {
  COLOR_PIP_ACTIVE,
  COLOR_PIP_STYLES,
  TYPE_FILTERS,
  type CardFilterControls,
  type CmcBucket,
  type ManaColor,
} from '../model/cardFilters';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery';
import { CollapsibleSection } from '../../../shared/components/CollapsibleSection';

export type FilterPanelProps = CardFilterControls;

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
 * Collapsible on mobile to save space; expanded on desktop.
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
}: FilterPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const count = activeFilterCount(search, activeColors, activeCmc, activeType);

  return (
    <div className="mb-lg">
      <CollapsibleSection
        title="Filters"
        icon="filter_list"
        defaultOpen={isDesktop}
        className="glass-panel rounded-2xl shadow-lg overflow-hidden"
        headerClassName="rounded-t-2xl"
        contentClassName="px-md pb-md"
        badge={
          count > 0 ? (
            <span className="bg-primary text-on-primary text-[11px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
              {count}
            </span>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-md">
          {/* Row 1: search */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none placeholder:text-on-surface-variant/50 transition-all"
              placeholder="Filter Cards by name..."
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Row 2: color pips + CMC */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/20">
              {(['W', 'U', 'B', 'R', 'G', 'C'] as ManaColor[]).map((color) => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px] border transition-all ${
                    activeColors.includes(color) ? COLOR_PIP_ACTIVE[color] : COLOR_PIP_STYLES[color]
                  }`}
                  onClick={() => onToggleColor(color)}
                  aria-pressed={activeColors.includes(color)}
                >
                  {color}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-xs">
              <span className="text-label-sm text-on-surface-variant mr-1 uppercase tracking-widest text-[10px] hidden sm:inline">
                Mana Value
              </span>
              <div className="flex gap-1.5">
                {(['0', '1', '2', '3', '4', '5+'] as CmcBucket[]).map((bucket) => (
                  <button
                    key={bucket}
                    className={`w-9 h-9 rounded-lg text-label-sm border transition-all ${
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
          </div>

          {/* Row 3: type filters */}
          <div className="flex flex-wrap gap-sm border-t border-outline-variant/10 pt-md">
            {TYPE_FILTERS.map((type) => (
              <button
                key={type}
                className={`px-4 py-2 rounded-full text-label-sm transition-colors font-medium border min-h-[40px] ${
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
