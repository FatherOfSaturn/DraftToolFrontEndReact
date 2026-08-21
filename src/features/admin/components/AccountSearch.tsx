import { useState } from 'react';
import { adminApi } from '../api/adminApi';
import { gameApi } from '../../draft/api/gameApi';
import type { GameHistoryEntry, Deck } from '../../account/model/accountTypes';

export function AccountSearch() {
  const [accountId, setAccountId] = useState('');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = async () => {
    const id = accountId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setLoaded(false);
    setDisplayName(null);
    try {
      const [account, g, d] = await Promise.all([
        adminApi.getAccountByID(id),
        adminApi.getGameHistoryByID(id),
        adminApi.getDecksByID(id),
      ]);
      setDisplayName(account.displayName);
      setGames(g);
      setDecks(d);
      setLoaded(true);
    } catch {
      setError('Failed to load account data. Check the Account ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const q = filterText.toLowerCase();

  async function handleDeleteGame(gameID: string) {
    if (!window.confirm('Delete this game?')) return;
    try {
      await gameApi.deleteGame(gameID);
      setGames((current) => current.filter((g) => g.gameID !== gameID));
    } catch {
      setError('Failed to delete game.');
    }
  }

  async function handleDeleteDeck(deckID: string) {
    if (!window.confirm('Delete this deck?')) return;
    try {
      await adminApi.deleteDeckByID(accountId.trim(), deckID);
      setDecks((current) => current.filter((d) => d.deckID !== deckID));
    } catch {
      setError('Failed to delete deck.');
    }
  }

  const filteredGames = games.filter((g) =>
    q
      ? g.players
          .map((p) => p.displayName ?? p.name ?? '')
          .some((name) => name.toLowerCase().includes(q))
      : true,
  );

  const filteredDecks = decks.filter((d) =>
    q ? d.name.toLowerCase().includes(q) : true,
  );

  return (
    <section className="bg-surface-container-low rounded-2xl p-lg border border-outline-variant/10 flex flex-col gap-lg shadow-xl">
      {/* Account ID Lookup */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-md">
        <div className="flex flex-col gap-xs flex-1">
          <h2 className="font-headline-md text-on-surface">Account Lookup</h2>
          <p className="font-label-sm text-outline">Enter an Account ID to view their games and decks.</p>
        </div>
        <div className="flex items-center gap-sm w-full sm:w-auto">
          <div className="flex items-center bg-surface-container-lowest px-md py-sm rounded-xl border border-outline-variant/30 flex-1 sm:w-80 shadow-inner">
            <span className="material-symbols-outlined text-primary mr-sm">key</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-md w-full text-on-surface placeholder-outline font-body-md"
              placeholder="Enter Account ID…"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            />
          </div>
          <button
            onClick={handleLoad}
            disabled={loading || !accountId.trim()}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-md py-sm rounded-xl font-label-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              'Load'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-md py-sm text-error text-sm">{error}</div>
      )}

      {loaded && !error && (
        <>
          {/* Account Info + Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md bg-surface-container-high/30 rounded-xl border border-outline-variant/10 px-md py-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-sm">person</span>
              <span className="font-label-sm text-on-surface">{displayName ?? 'Unknown Account'}</span>
              <span className="text-[10px] text-outline font-label-md">({games.length} games, {decks.length} decks)</span>
            </div>
            <div className="flex items-center gap-sm flex-1 sm:max-w-xs">
              <span className="material-symbols-outlined text-outline text-sm">filter_alt</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder-outline font-body-md"
                placeholder="Filter by player or deck name…"
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              {filterText && (
                <button onClick={() => setFilterText('')} className="text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Data Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            {/* Recent Games */}
            <div className="flex flex-col gap-md">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-xs">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">history_edu</span>
                  <h3 className="font-label-sm text-outline uppercase tracking-widest">Recent Games</h3>
                </div>
                <span className="text-[10px] text-outline font-label-md">Showing {filteredGames.length}/{games.length}</span>
              </div>
              <div className="space-y-sm">
                {filteredGames.map((game) => (
                  <div key={game.gameID} className="flex items-center justify-between gap-md p-md bg-surface-container-high/50 rounded-xl border border-outline-variant/5 hover:border-primary/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">{game.cubeID}</span>
                      <span className="text-[10px] text-outline">
                        {game.players.map((p) => p.displayName ?? p.name ?? '?').join(' vs ')} · {game.gameType}
                      </span>
                    </div>
                    <button
                      className="p-1 hover:bg-error/10 rounded-md text-outline hover:text-error transition-colors"
                      title="Delete game"
                      onClick={() => handleDeleteGame(game.gameID)}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
                {filteredGames.length === 0 && (
                  <p className="text-center text-on-surface-variant text-body-sm py-md">No games match this filter.</p>
                )}
              </div>
            </div>

            {/* Saved Decks */}
            <div className="flex flex-col gap-md">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-xs">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">style</span>
                  <h3 className="font-label-sm text-outline uppercase tracking-widest">Saved Decks</h3>
                </div>
                <span className="text-[10px] text-outline font-label-md">Showing {filteredDecks.length}/{decks.length}</span>
              </div>
              <div className="space-y-sm">
                {filteredDecks.map((deck) => (
                  <div key={deck.deckID} className="flex items-center justify-between gap-md p-md bg-surface-container-high/50 rounded-xl border border-outline-variant/5 hover:border-secondary/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">{deck.name}</span>
                      <span className="text-[10px] text-outline">{deck.cardIds.length} cards</span>
                    </div>
                    <button
                      className="p-1 hover:bg-error/10 rounded-md text-outline hover:text-error transition-colors"
                      title="Delete deck"
                      onClick={() => handleDeleteDeck(deck.deckID)}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
                {filteredDecks.length === 0 && (
                  <p className="text-center text-on-surface-variant text-body-sm py-md">No decks match this filter.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
