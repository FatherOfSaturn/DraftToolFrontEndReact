import { useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
  MOCK_PAST_RITUALS,
  MOCK_SAVED_MANIFESTATIONS,
  type PastRitual,
  type SavedManifestation,
} from '../data/mockAccountData';

function formatRitualDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace(',', '');
}

/**
 * Account dashboard: a searchable/filterable history of past drafts
 * ("Past Rituals") and a grid of saved decklists ("Saved
 * Manifestations"). Both data sets are mock/static (see
 * data/mockAccountData.ts) — there's no backend account endpoint wired
 * up yet, so search/filtering operates entirely client-side over the
 * mock arrays.
 */
export function AccountPage() {
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [appliedPartnerFilter, setAppliedPartnerFilter] = useState('');
  const [appliedDateFilter, setAppliedDateFilter] = useState('');

  const filteredRituals = useMemo(() => {
    return MOCK_PAST_RITUALS.filter((ritual) => {
      if (search && !ritual.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (
        appliedPartnerFilter &&
        !ritual.partnerName.toLowerCase().includes(appliedPartnerFilter.toLowerCase())
      ) {
        return false;
      }
      if (appliedDateFilter && ritual.date !== appliedDateFilter) return false;
      return true;
    });
  }, [search, appliedPartnerFilter, appliedDateFilter]);

  function applyFilters() {
    setAppliedPartnerFilter(partnerFilter);
    setAppliedDateFilter(dateFilter);
  }

  function exportDraft(ritual: PastRitual) {
    // No backend support for real export yet — download what we have
    // client-side so the button does something real rather than nothing.
    const payload = JSON.stringify(ritual, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ritual.gameID}-draft-list.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="font-body-md text-on-surface bg-surface-dim min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header search={{ value: search, onChange: setSearch, placeholder: 'Search archives...' }} />

      <main className="pt-32 pb-24 px-4 md:px-margin-desktop max-w-[1400px] mx-auto min-h-screen relative flex-1">
        <BackgroundAmbience />

        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <h1 className="font-display text-display text-primary drop-shadow-[0_0_15px_rgba(213,186,255,0.4)]">
                Saved Account Data
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                See all your past drafts, and any decks you have saved.
              </p>
            </div>

            <FilterPanel
              partnerFilter={partnerFilter}
              onPartnerFilterChange={setPartnerFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onApply={applyFilters}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
          <PastRitualsSection rituals={filteredRituals} total={MOCK_PAST_RITUALS.length} onExport={exportDraft} />
          <SavedManifestationsSection manifestations={MOCK_SAVED_MANIFESTATIONS} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function BackgroundAmbience() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full" />
    </div>
  );
}

interface FilterPanelProps {
  partnerFilter: string;
  onPartnerFilterChange: (v: string) => void;
  dateFilter: string;
  onDateFilterChange: (v: string) => void;
  onApply: () => void;
}

function FilterPanel({
  partnerFilter,
  onPartnerFilterChange,
  dateFilter,
  onDateFilterChange,
  onApply,
}: FilterPanelProps) {
  return (
    <div className="glass-panel p-md rounded-xl flex flex-wrap items-center gap-4 arcane-glow">
      <div className="flex flex-col gap-1">
        <label className="font-label-sm text-label-sm text-outline px-1">Filter by Partner</label>
        <div className="flex items-center bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[18px] mr-2">person_search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-label-md text-on-surface w-40"
            placeholder="Partner Name..."
            type="text"
            value={partnerFilter}
            onChange={(e) => onPartnerFilterChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-label-sm text-label-sm text-outline px-1">Filter by Date</label>
        <div className="flex items-center bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[18px] mr-2">calendar_today</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-label-md text-on-surface w-40 [color-scheme:dark]"
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
          />
        </div>
      </div>
      <button
        className="self-end bg-surface-variant hover:bg-primary-container/20 text-primary border border-primary/30 font-label-md text-label-md px-6 py-2.5 rounded-lg transition-all h-[42px]"
        onClick={onApply}
      >
        Apply Filters
      </button>
    </div>
  );
}

interface PastRitualsSectionProps {
  rituals: PastRitual[];
  total: number;
  onExport: (ritual: PastRitual) => void;
}

function PastRitualsSection({ rituals, total, onExport }: PastRitualsSectionProps) {
  return (
    <section className="xl:col-span-7 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-lg text-headline-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[32px]">history_edu</span>
          Past Drafts
        </h2>
        <span className="font-label-sm text-label-sm bg-surface-container-high px-3 py-1 rounded-full text-outline-variant">
          Total: {total} Drafts
        </span>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden arcane-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/30">
                <th className="px-6 py-4 font-label-md text-label-md text-outline">Game ID</th>
                <th className="px-6 py-4 font-label-md text-label-md text-outline">Partner Name</th>
                <th className="px-6 py-4 font-label-md text-label-md text-outline">Date</th>
                <th className="px-6 py-4 font-label-md text-label-md text-outline text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rituals.map((ritual) => (
                <tr key={ritual.gameID} className="group hover:bg-surface-container/50 transition-colors">
                  <td className="px-6 py-5 font-label-md text-primary">#{ritual.gameID}</td>
                  <td className="px-6 py-5 font-body-md font-semibold text-on-surface">
                    <div className="flex items-center justify-between gap-2">
                      <span>{ritual.name}</span>
                      <button className="material-symbols-outlined text-outline-variant hover:text-primary transition-colors text-[18px]">
                        edit
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-label-sm text-on-surface-variant">
                    {formatRitualDate(ritual.date)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      className="font-label-sm text-label-sm bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg border border-primary/20 transition-all flex items-center gap-2 ml-auto"
                      onClick={() => onExport(ritual)}
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Export Draft List
                    </button>
                  </td>
                </tr>
              ))}
              {rituals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant font-body-md">
                    No drafts match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-surface-container-high/30 flex justify-center">
          <button className="text-on-surface-variant hover:text-primary font-label-md transition-all flex items-center gap-2 group">
            Show More
            <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">
              expand_more
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

interface SavedManifestationsSectionProps {
  manifestations: SavedManifestation[];
}

function SavedManifestationsSection({ manifestations }: SavedManifestationsSectionProps) {
  return (
    <section className="xl:col-span-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-lg text-headline-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-[32px]">auto_fix_high</span>
          Saved Decks
        </h2>
        <button className="font-label-sm text-label-sm text-secondary hover:underline transition-all">
          View All
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden arcane-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/30">
                <th className="px-4 py-3 font-label-md text-label-md text-outline">Manifestation</th>
                <th className="px-4 py-3 font-label-md text-label-md text-outline">ID</th>
                <th className="px-4 py-3 font-label-md text-label-md text-outline">Partner</th>
                <th className="px-4 py-3 font-label-md text-label-md text-outline text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {manifestations.map((m) => (
                <tr key={m.id} className="group hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-body-md font-semibold text-on-surface">{m.name}</span>
                      <button className="material-symbols-outlined text-outline-variant hover:text-primary transition-colors text-[16px]">
                        edit
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-label-sm text-primary">{m.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[16px]">person</span>
                      <span className="font-body-md text-on-surface-variant text-sm">{m.partnerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
                      arrow_forward_ios
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-surface-container-high/30 border-t border-outline-variant/20">
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <span className="material-symbols-outlined text-primary text-[20px]">add</span>
            <span className="font-label-md text-on-surface-variant group-hover:text-primary">
              Create New Deck
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

