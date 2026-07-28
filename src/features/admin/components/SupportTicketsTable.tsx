import { useMemo, useState } from 'react';
import type { SupportRequest, SupportType } from '../../feature-requests/api/supportApi';

interface SupportTicketsTableProps {
  requests: SupportRequest[];
}

const TYPE_LABELS: Record<SupportType, string> = {
  new_feature: 'Feature',
  bug_fix: 'Bug',
  misc_support: 'Feedback',
};

const TYPE_COLORS: Record<SupportType, string> = {
  new_feature: 'bg-primary/20 text-primary',
  bug_fix: 'bg-error/20 text-error',
  misc_support: 'bg-secondary/20 text-secondary',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Open',
  in_progress: 'In Progress',
  completed: 'Resolved',
  blocked: 'Blocked',
  deleted: 'Deleted',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'text-outline',
  in_progress: 'text-primary',
  completed: 'text-secondary',
  blocked: 'text-error',
  deleted: 'text-outline',
};

const PRIORITY_DOTS: Record<string, string> = {
  critical: 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]',
  high: 'bg-tertiary-container',
  medium: 'bg-primary',
  low: 'bg-outline',
};

export function SupportTicketsTable({ requests }: SupportTicketsTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (dateFilter) {
        const reqDate = r.createdOnDate.substring(0, 10);
        if (reqDate !== dateFilter) return false;
      }
      return true;
    });
  }, [requests, search, typeFilter, priorityFilter, statusFilter, dateFilter]);

  return (
    <section className="bg-surface-container-low rounded-2xl p-lg border border-outline-variant/10 flex flex-col gap-lg shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md border-b border-outline-variant/10 pb-md">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm">
            <span className="w-12 h-[1px] bg-primary" />
            <span className="font-label-sm text-primary uppercase tracking-[0.2em]">Support</span>
          </div>
          <h2 className="font-headline-md text-on-surface">Support Tickets</h2>
        </div>
        <div className="flex items-center bg-surface-container-lowest px-md py-sm rounded-xl border border-outline-variant/30 w-full sm:w-96 shadow-inner">
          <span className="material-symbols-outlined text-primary mr-sm">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder-outline font-body-md"
            placeholder="Search title or description…"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md p-md bg-surface-container-high/30 rounded-xl border border-outline-variant/10">
        <select
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-sm py-1.5 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="bug_fix">Bug</option>
          <option value="new_feature">Feature Request</option>
          <option value="misc_support">Feedback</option>
        </select>
        <select
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-sm py-1.5 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-sm py-1.5 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="new">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Resolved</option>
          <option value="blocked">Blocked</option>
        </select>
        <input
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-sm py-1.5 text-xs text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead className="bg-surface-container-high/50 text-outline font-label-sm uppercase tracking-widest">
            <tr>
              <th className="p-md border-b border-outline-variant/10">Title</th>
              <th className="p-md border-b border-outline-variant/10">Type</th>
              <th className="p-md border-b border-outline-variant/10">Priority</th>
              <th className="p-md border-b border-outline-variant/10">Status</th>
              <th className="p-md border-b border-outline-variant/10">Contact</th>
              <th className="p-md border-b border-outline-variant/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((req) => (
              <tr key={req.id} className="hover:bg-surface-container-high/30 transition-colors">
                <td className="p-md border-b border-outline-variant/5">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface">{req.title}</span>
                    <span className="text-xs text-outline truncate w-48">{req.description}</span>
                  </div>
                </td>
                <td className="p-md border-b border-outline-variant/5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-label-md uppercase ${TYPE_COLORS[req.type]}`}>
                    {TYPE_LABELS[req.type]}
                  </span>
                </td>
                <td className="p-md border-b border-outline-variant/5">
                  <div className="flex items-center gap-xs">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOTS[req.priority] ?? 'bg-outline'}`} />
                    <span className="text-xs text-on-surface capitalize">{req.priority}</span>
                  </div>
                </td>
                <td className="p-md border-b border-outline-variant/5">
                  <span className={`text-xs ${STATUS_COLORS[req.status] ?? 'text-outline'}`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                </td>
                <td className="p-md border-b border-outline-variant/5">
                  <span className="text-xs text-on-surface-variant">{req.contactEmail}</span>
                </td>
                <td className="p-md border-b border-outline-variant/5 text-right">
                  <button
                    className="p-1 hover:bg-surface-container rounded-md mr-xs"
                    title="View details"
                    onClick={() => alert(`Ticket: ${req.title}\n\n${req.description}`)}
                  >
                    <span className="material-symbols-outlined text-outline text-sm">visibility</span>
                  </button>
                  <button
                    className="p-1 hover:bg-surface-container rounded-md"
                    title="Mark as resolved"
                    onClick={() => alert('Status update coming soon.')}
                  >
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-md text-center text-on-surface-variant text-body-sm">
                  No tickets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
