import { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import type { DonationStats } from '../model/adminTypes';
import type { SupportRequest } from '../../feature-requests/api/supportApi';

interface StatsCardsProps {
  supportRequests: SupportRequest[];
}

interface DraftCounts {
  pyramid: number;
  chaos: number;
  winston: number;
}

export function StatsCards({ supportRequests }: StatsCardsProps) {
  const [donations, setDonations] = useState<DonationStats | null>(null);
  const [drafts, setDrafts] = useState<DraftCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi.getDonationStats(),
      adminApi.getDraftTypeCount('pyramid'),
      adminApi.getDraftTypeCount('chaos'),
      adminApi.getDraftTypeCount('winston'),
    ])
      .then(([d, py, ch, wi]) => {
        if (!cancelled) {
          setDonations(d);
          setDrafts({ pyramid: py, chaos: ch, winston: wi });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const bugTotal = supportRequests.filter((r) => r.type === 'bug_fix').length;
  const bugFixed = supportRequests.filter((r) => r.type === 'bug_fix' && r.status === 'completed').length;
  const featTotal = supportRequests.filter((r) => r.type === 'new_feature').length;
  const featFixed = supportRequests.filter((r) => r.type === 'new_feature' && r.status === 'completed').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
      {/* Donation Overview */}
      <div className="bg-surface-container-low p-md rounded-2xl flex flex-col gap-sm border border-outline-variant/10">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-tertiary">payments</span>
          <h3 className="font-label-sm text-outline uppercase tracking-widest">Donation Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-md mt-xs">
          <div className="flex flex-col">
            <span className="font-display text-on-surface text-2xl">${donations?.totalDonated.toLocaleString() ?? '—'}</span>
            <span className="font-label-sm text-outline">Total Donated</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-secondary text-2xl">${donations?.currentMonthly.toLocaleString() ?? '—'}</span>
            <span className="font-label-sm text-outline">Current Monthly</span>
          </div>
        </div>
      </div>

      {/* Support Overview */}
      <div className="bg-surface-container-low p-md rounded-2xl flex flex-col gap-sm border border-outline-variant/10">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">forum</span>
          <h3 className="font-label-sm text-outline uppercase tracking-widest">Support Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-md mt-xs">
          <SupportMiniBar label="Bugs" fixed={bugFixed} total={bugTotal} color="error" />
          <SupportMiniBar label="Features" fixed={featFixed} total={featTotal} color="primary" />
        </div>
      </div>

      {/* Draft Types Completed */}
      <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/10 flex flex-col justify-between">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-secondary">analytics</span>
          <h3 className="font-label-sm text-outline uppercase tracking-widest">Draft Types Completed</h3>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative w-32 h-32 flex-shrink-0">
            <DonutChart counts={drafts} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-outline uppercase tracking-tighter leading-none">Total</span>
              <span className="font-headline-md text-primary text-sm">
                {drafts ? `${drafts.pyramid + drafts.chaos + drafts.winston}` : '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-xs flex-1">
            <FormatLegend label="Pyramid" count={drafts?.pyramid} color="bg-primary" />
            <FormatLegend label="Chaos" count={drafts?.chaos} color="bg-secondary" />
            <FormatLegend label="Winston" count={drafts?.winston} color="bg-tertiary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportMiniBar({ label, fixed, total, color }: { label: string; fixed: number; total: number; color: string }) {
  const pct = total > 0 ? (fixed / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-xs">
          <span className={`font-headline-md text-${color}`}>{String(fixed).padStart(2, '0')}</span>
          <span className="text-outline text-sm">/</span>
          <span className="font-label-md text-on-surface">{total}</span>
        </div>
        <span className="font-label-sm text-outline uppercase tracking-tighter">{label}</span>
      </div>
      <div className="h-2 w-full bg-outline-variant/20 rounded-full overflow-hidden relative">
        <div className={`absolute inset-0 bg-${color}/20 blur-sm`} />
        <div className={`h-full bg-${color} rounded-full relative z-10 shadow-[0_0_8px_rgba(213,186,255,0.6)]`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-label-sm text-outline mt-xs">Fixed/Total</span>
    </div>
  );
}

function FormatLegend({ label, count, color }: { label: string; count?: number; color: string }) {
  return (
    <div className="flex items-center gap-xs">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-on-surface uppercase tracking-widest">
        {label} ({count != null ? count.toLocaleString() : '—'})
      </span>
    </div>
  );
}

function DonutChart({ counts }: { counts: DraftCounts | null }) {
  if (!counts) {
    return (
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#353437" strokeWidth="4" />
      </svg>
    );
  }
  const total = counts.pyramid + counts.chaos + counts.winston;
  if (total === 0) {
    return (
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#353437" strokeWidth="4" />
      </svg>
    );
  }
  const segments = [
    { pct: (counts.pyramid / total) * 100, color: '#d5baff' },
    { pct: (counts.chaos / total) * 100, color: '#98cbff' },
    { pct: (counts.winston / total) * 100, color: '#ffb59d' },
  ];
  let offset = 0;
  return (
    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
      <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#353437" strokeWidth="4" />
      {segments.map((seg, i) => {
        const dash = `${seg.pct} ${100 - seg.pct}`;
        const o = -offset;
        offset += seg.pct;
        return (
          <circle
            key={i}
            cx="18" cy="18" fill="transparent"
            r="15.915" stroke={seg.color}
            strokeDasharray={dash} strokeDashoffset={o}
            strokeWidth="4"
          />
        );
      })}
    </svg>
  );
}
