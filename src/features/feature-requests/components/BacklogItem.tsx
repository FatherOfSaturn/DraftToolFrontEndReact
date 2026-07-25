export interface BacklogItemProps {
  icon: string;
  name: string;
  status: string;
  statusLabel: string;
  thumbUpPct: number;
  thumbDownPct: number;
  implemented?: boolean;
}

export function BacklogItem({ icon, name, status, statusLabel, thumbUpPct, thumbDownPct, implemented }: BacklogItemProps) {
  if (implemented) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
        <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
        <span className="flex-1 font-body-md text-body-md text-secondary/80 line-through">{name}</span>
        <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-xs text-label-xs">Implemented</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-highest/30 transition-colors">
      <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-label-md text-label-md text-on-surface truncate">{name}</p>
        <p className="font-label-xs text-label-xs text-on-surface-variant">{statusLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">thumb_up</span>
          <span className="font-label-xs text-label-xs">{thumbUpPct}%</span>
        </div>
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">thumb_down</span>
          <span className="font-label-xs text-label-xs">{thumbDownPct}%</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full font-label-xs text-label-xs ${
          status === 'planned' ? 'bg-tertiary/15 text-tertiary' :
          status === 'in_progress' ? 'bg-secondary/15 text-secondary' :
          'bg-surface-container-highest/50 text-on-surface-variant'
        }`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
