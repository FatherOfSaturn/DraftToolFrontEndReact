import { useEffect, useState } from 'react';
import { supportApi, type SupportRequest, type SupportType } from '../api/supportApi';

const TYPE_ICONS: Record<SupportType, string> = {
  new_feature: 'lightbulb',
  bug_fix: 'bug_report',
  misc_support: 'help',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
};

function formatType(type: SupportType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FeatureBacklog() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supportApi.getAll()
      .then((data) => { if (!cancelled) setRequests(data); })
      .catch(() => { if (!cancelled) setError('Could not load backlog.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="glass-panel rounded-xl p-md">
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
        Request Backlog
      </h3>

      {loading && (
        <div className="flex items-center justify-center py-md">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-body-sm text-on-surface-variant text-center py-sm">{error}</p>
      )}

      {!loading && !error && requests.length === 0 && (
        <p className="text-body-sm text-on-surface-variant text-center py-sm">No requests yet. Be the first to submit one!</p>
      )}

      <div className="flex flex-col gap-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              req.status === 'completed'
                ? 'bg-secondary/10 border border-secondary/20'
                : 'hover:bg-surface-container-highest/30'
            }`}
          >
            <span className={`material-symbols-outlined text-xl ${
              req.status === 'completed' ? 'text-secondary' : 'text-primary'
            }`}>
              {req.status === 'completed' ? 'check_circle' : TYPE_ICONS[req.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-label-md text-label-md text-on-surface truncate ${
                req.status === 'completed' ? 'line-through text-secondary/80' : ''
              }`}>
                {req.title}
              </p>
              <p className="font-label-xs text-label-xs text-on-surface-variant">
                {formatType(req.type)} · {formatDate(req.createdOnDate)}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-full font-label-xs text-label-xs shrink-0 ${
              req.status === 'new' ? 'bg-tertiary/15 text-tertiary' :
              req.status === 'in_progress' ? 'bg-secondary/15 text-secondary' :
              req.status === 'completed' ? 'bg-secondary/15 text-secondary' :
              req.status === 'blocked' ? 'bg-error/15 text-error' :
              'bg-surface-container-highest/50 text-on-surface-variant'
            }`}>
              {STATUS_LABELS[req.status] ?? req.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
