import {
  COLOR_PIP_ACTIVE,
  COLOR_PIP_STYLES,
  TYPE_FILTERS,
  type CardFilterControls,
  type CmcBucket,
  type ManaColor,
} from '../model/cardFilters';

export type FilterPanelProps = CardFilterControls;

/**
 * The search/color/CMC/type filter bar used above the draft board's card
 * grid. Reusable wherever a filterable card list is needed.
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
  return (
    <div className="mb-lg glass-panel p-md rounded-2xl flex flex-col gap-md shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-md flex-1">
          <div className="relative flex-1 max-w-sm">
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

          <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/20">
            {(['W', 'U', 'B', 'R', 'G'] as ManaColor[]).map((color) => (
              <button
                key={color}
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[14px] border transition-all ${
                  activeColors.includes(color) ? COLOR_PIP_ACTIVE[color] : COLOR_PIP_STYLES[color]
                }`}
                onClick={() => onToggleColor(color)}
                aria-pressed={activeColors.includes(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-xs">
          <span className="text-label-sm text-on-surface-variant mr-2 uppercase tracking-widest text-[10px]">
            Mana Value
          </span>
          <div className="flex gap-1.5">
            {(['0', '1', '2', '3', '4', '5+'] as CmcBucket[]).map((bucket) => (
              <button
                key={bucket}
                className={`w-8 h-8 rounded-lg text-label-sm border transition-all ${
                  activeCmc === bucket
                    ? 'bg-primary/20 text-primary border-primary/40 font-bold'
                    : 'bg-surface-container-high hover:bg-primary/20 border-outline-variant/20'
                }`}
                onClick={() => onToggleCmc(bucket)}
                aria-pressed={activeCmc === bucket}
              >
                {bucket}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-sm border-t border-outline-variant/10 pt-md">
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            className={`px-4 py-1.5 rounded-full text-label-sm transition-colors font-medium border ${
              activeType === type
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary/50'
            }`}
            onClick={() => onToggleType(type)}
            aria-pressed={activeType === type}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
