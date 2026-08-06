import { useNavigate } from 'react-router-dom';
import { Footer } from '../../../shared/components/layout/Footer';
import { Header } from '../../../shared/components/layout/Header';
import { useAuth } from '../../auth/AuthContext';
import { AccountProfile } from '../components/AccountProfile';
import { PastDraftFilters } from '../components/PastDraftFilters';
import { PastDraftsSection } from '../components/PastDraftsSection';
import { SavedDecksSection } from '../components/SavedDecksSection';
import { useAccountDecks } from '../hooks/useAccountDecks';
import { useGameHistory } from '../hooks/useGameHistory';

export function AccountPage() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const { decks, isLoading, error, deleteDeck, updateDeck, pagination: deckPagination } = useAccountDecks(account?.accountID);
  const { games, pagination, filters } = useGameHistory(account?.accountID);

  return (
    <div className="font-body-md text-on-surface bg-surface-dim min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      <main className="pt-32 pb-24 px-4 md:px-margin-desktop max-w-[1400px] mx-auto min-h-screen relative flex-1">
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full" />
        </div>

        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <h1 className="font-display text-display text-primary drop-shadow-[0_0_15px_rgba(213,186,255,0.4)]">Saved Account Data</h1>
              <AccountProfile />
            </div>
            <PastDraftFilters
              partnerFilter={filters.playerNameFilter}
              onPartnerFilterChange={filters.setPlayerNameFilter}
              dateFilter={filters.dateFilter}
              onDateFilterChange={filters.setDateFilter}
              statusFilter={filters.statusFilter}
              onStatusFilterChange={filters.setStatusFilter}
              onApply={filters.applyFilters}
              onReset={filters.resetFilters}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
          <PastDraftsSection
            games={games}
            pagination={pagination}
            currentPlayerNames={[account?.displayName, account?.email].filter(
              (name): name is string => typeof name === 'string' && name.length > 0
            )}
            currentAccountID={account?.accountID}
          />
          <SavedDecksSection decks={decks} loading={isLoading} error={error} onDelete={deleteDeck} onUpdate={updateDeck} onCreateNew={() => navigate('/deckbuilder')} pagination={deckPagination} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
