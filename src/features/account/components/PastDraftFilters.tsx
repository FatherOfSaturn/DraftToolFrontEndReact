import { CollapsibleSection } from '../../../shared/components/CollapsibleSection';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery';

interface PastDraftFiltersProps {
  partnerFilter: string;
  onPartnerFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function PastDraftFilters({
  partnerFilter,
  onPartnerFilterChange,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  onApply,
  onReset,
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
      <div className="flex flex-col gap-1">
        <label className="font-label-sm text-label-sm text-outline px-1">Filter by Status</label>
        <div className="flex items-center bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[18px] mr-2">flag</span>
          <select
            className="bg-transparent border-none focus:ring-0 text-label-md text-on-surface w-40 [color-scheme:dark]"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            <option value="" className="bg-surface-container-lowest text-on-surface">All</option>
            <option value="game_in_progress" className="bg-surface-container-lowest text-on-surface">In Progress</option>
            <option value="game_merged" className="bg-surface-container-lowest text-on-surface">Round 2</option>
            <option value="game_complete" className="bg-surface-container-lowest text-on-surface">Complete</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end">
        <button className="bg-surface-variant hover:bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 font-label-md text-label-md px-4 py-2.5 rounded-lg transition-all h-[42px]" onClick={onReset}>
          Reset
        </button>
        <button className="bg-surface-variant hover:bg-primary-container/20 text-primary border border-primary/30 font-label-md text-label-md px-6 py-2.5 rounded-lg transition-all h-[42px]" onClick={onApply}>
          Apply Filters
        </button>
      </div>
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
