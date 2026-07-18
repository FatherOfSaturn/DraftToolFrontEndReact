import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../../shared/components/Pagination';
import type { Pagination as PaginationState } from '../hooks/useGameHistory';
import type { GameSummary } from '../model/accountTypes';

interface PastDraftsSectionProps {
  games: GameSummary[];
  pagination: PaginationState;
}

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace(',', '');
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function PastDraftsSection({ games, pagination }: PastDraftsSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="xl:col-span-7 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-lg text-headline-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[32px]">history_edu</span>
          Past Drafts
        </h2>
        <span className="font-label-md text-label-md bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 rounded-full flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">history_edu</span>
          {pagination.totalItems} Draft{pagination.totalItems !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden arcane-glow">
        {/* Mobile: card list */}
        <div className="md:hidden divide-y divide-outline-variant/20">
          {games.map((game) => (
            <div key={game.gameID} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  className="font-label-sm text-primary text-left underline decoration-dotted underline-offset-2"
                  title={`${game.gameID} — Click to copy`}
                  onClick={() => copyToClipboard(game.gameID)}
                >
                  Click to copy Game-ID
                </button>
                <span className="text-label-sm text-on-surface-variant">{formatDate(game.createdAt)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Cube</span>
                  <a
                    href={`https://cubecobra.com/cube/list/${game.cubeID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-on-surface font-body-md text-primary hover:underline"
                    title="Click to visit cube on CubeCobra"
                  >
                    {game.cubeID}
                  </a>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Player 1</span>
                  <p className="text-on-surface font-body-md font-semibold">{game.player1Name}</p>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Player 2</span>
                  <p className="text-on-surface font-body-md font-semibold">{game.player2Name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 font-label-sm text-label-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-lg border border-primary/20 transition-all text-center"
                  onClick={() => navigate(`/deckbuilder/${encodeURIComponent(game.gameID)}/${encodeURIComponent(game.player1Name)}`)}
                >
                  P1 Board
                </button>
                <button
                  className="flex-1 font-label-sm text-label-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-lg border border-primary/20 transition-all text-center"
                  onClick={() => navigate(`/deckbuilder/${encodeURIComponent(game.gameID)}/${encodeURIComponent(game.player2Name)}`)}
                >
                  P2 Board
                </button>
              </div>
            </div>
          ))}
          {games.length === 0 && (
            <div className="px-6 py-10 text-center text-on-surface-variant font-body-md">
              No drafts match these filters.
            </div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/30">
                <th className="px-4 py-4 font-label-md text-label-md text-outline">Game ID</th>
                <th className="px-4 py-4 font-label-md text-label-md text-outline">Cube</th>
                <th className="px-4 py-4 font-label-md text-label-md text-outline">Player 1</th>
                <th className="px-4 py-4 font-label-md text-label-md text-outline">Player 2</th>
                <th className="px-4 py-4 font-label-md text-label-md text-outline">Date</th>
                <th className="px-4 py-4 font-label-md text-label-md text-outline text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {games.map((game) => (
                <tr key={game.gameID} className="group hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-5">
                    <button
                      className="font-label-md text-primary cursor-pointer underline decoration-dotted underline-offset-2"
                      title={`${game.gameID} — Click to copy`}
                      onClick={() => copyToClipboard(game.gameID)}
                    >
                      Click to copy Game-ID
                    </button>
                  </td>
                  <td className="px-4 py-5">
                    <a
                      href={`https://cubecobra.com/cube/list/${game.cubeID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body-md text-primary hover:underline"
                      title="Click to visit cube on CubeCobra"
                    >
                      {game.cubeID}
                    </a>
                  </td>
                  <td className="px-4 py-5 font-body-md font-semibold text-on-surface">{game.player1Name}</td>
                  <td className="px-4 py-5 font-body-md font-semibold text-on-surface">{game.player2Name}</td>
                  <td className="px-4 py-5 font-label-sm text-on-surface-variant">{formatDate(game.createdAt)}</td>
                  <td className="px-4 py-5 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        className="font-label-sm text-label-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg border border-primary/20 transition-all"
                        onClick={() => navigate(`/deckbuilder/${encodeURIComponent(game.gameID)}/${encodeURIComponent(game.player1Name)}`)}
                      >
                        Player 1 Draftboard
                      </button>
                      <button
                        className="font-label-sm text-label-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg border border-primary/20 transition-all"
                        onClick={() => navigate(`/deckbuilder/${encodeURIComponent(game.gameID)}/${encodeURIComponent(game.player2Name)}`)}
                      >
                        Player 2 Draftboard
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {games.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant font-body-md">
                    No drafts match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
      </div>
    </section>
  );
}
