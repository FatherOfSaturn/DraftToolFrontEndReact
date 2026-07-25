import { BacklogItem } from './BacklogItem';

const BACKLOG_ITEMS = [
  { icon: 'flash_on', name: 'Quick Draft Mode', status: 'planned', statusLabel: 'Planned', thumbUpPct: 89, thumbDownPct: 11 },
  { icon: 'history', name: 'Draft History Timeline', status: 'in_progress', statusLabel: 'In Progress', thumbUpPct: 76, thumbDownPct: 24 },
  { icon: 'palette', name: 'Custom Card Skins', status: 'under_review', statusLabel: 'Under Review', thumbUpPct: 64, thumbDownPct: 36 },
];

export function FeatureBacklog() {
  return (
    <div className="glass-panel rounded-xl p-md">
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
        Feature Backlog
      </h3>
      <div className="flex flex-col gap-2">
        {BACKLOG_ITEMS.map((item) => (
          <BacklogItem key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
}
