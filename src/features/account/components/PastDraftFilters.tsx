import { CollapsibleSection } from '../../../shared/components/CollapsibleSection';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery';

interface PastDraftFiltersProps {
  partnerFilter: string;
  onPartnerFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  onApply: () => void;
}

export function PastDraftFilters({
  partnerFilter,
  onPartnerFilterChange,
  dateFilter,
  onDateFilterChange,
  onApply,
}: PastDraftFiltersProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const content = (
    <>
      <div className="flex flex-col gap-1">
        <label className="font-label-sm text-label-sm text-outline px-1">Filter by Player</label>
        <div className="flex items-center bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[18px] mr-2">person_search</span>
          <input className="bg-transparent border-none focus:ring-0 text-label-md text-on-surface w-40" placeholder="Player Name..." type="text" value={partnerFilter} onChange={(event) => onPartnerFilterChange(event.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-label-sm text-label-sm text-outline px-1">Filter by Date</label>
        <div className="flex items-center bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[18px] mr-2">calendar_today</span>
          <input className="bg-transparent border-none focus:ring-0 text-label-md text-on-surface w-40 [color-scheme:dark]" type="date" value={dateFilter} onChange={(event) => onDateFilterChange(event.target.value)} />
        </div>
      </div>
      <button className="self-end bg-surface-variant hover:bg-primary-container/20 text-primary border border-primary/30 font-label-md text-label-md px-6 py-2.5 rounded-lg transition-all h-[42px]" onClick={onApply}>
        Apply Filters
      </button>
    </>
  );

  if (isDesktop) {
    return (
      <div className="glass-panel p-md rounded-xl flex flex-wrap items-center gap-4 arcane-glow">
        {content}
      </div>
    );
  }

  return (
    <CollapsibleSection
      title="Game Filters"
      icon="filter_list"
      defaultOpen={false}
      className="glass-panel rounded-xl arcane-glow"
      headerClassName="rounded-t-xl"
      contentClassName="px-md pb-md"
    >
      <div className="flex flex-wrap items-center gap-4">
        {content}
      </div>
    </CollapsibleSection>
  );
}
