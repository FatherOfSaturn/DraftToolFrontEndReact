import { useEffect, useState } from 'react';
import { Header } from '../../../shared/components/layout/Header';
import { Footer } from '../../../shared/components/layout/Footer';
import { AdminGuard } from '../components/AdminGuard';
import { StatsCards } from '../components/StatsCards';
import { AccountSearch } from '../components/AccountSearch';
import { SupportTicketsTable } from '../components/SupportTicketsTable';
import { supportApi, type SupportRequest } from '../../feature-requests/api/supportApi';

export function AdminPage() {
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supportApi.getAll()
      .then((data) => { if (!cancelled) setSupportRequests(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminGuard>
      <div className="font-body-md text-body-md bg-surface-dim min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
        <Header />
        <main className="pt-16 pb-24 relative flex-1">
          {/* Page Header */}
          <div className="px-margin-mobile md:px-margin-desktop pt-lg pb-md flex flex-col sm:flex-row sm:justify-between sm:items-end gap-md">
            <div className="flex flex-col gap-xs">
              <div className="flex items-center gap-sm">
                <span className="w-12 h-[1px] bg-primary" />
                <span className="font-label-sm text-primary uppercase tracking-[0.2em]">Admin Dashboard</span>
              </div>
              <h1 className="font-display text-display text-on-surface tracking-tighter">Admin Panel</h1>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-xs">
              <span className="font-label-md text-outline">App Version: 1.0.0</span>
              <span className="font-label-sm text-tertiary uppercase tracking-widest">System Status: Operational</span>
            </div>
          </div>

          <div className="px-margin-mobile md:px-margin-desktop flex flex-col gap-xl">
            {/* Stats Cards */}
            <StatsCards supportRequests={supportRequests} />

            {/* Account Search */}
            <AccountSearch />

            {/* Support Tickets */}
            {loading ? (
              <div className="flex items-center justify-center py-xl">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <SupportTicketsTable requests={supportRequests} />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AdminGuard>
  );
}
