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
        {games.length === 0 && (
          <div className="p-10 text-center text-on-surface-variant font-body-md">
            No drafts match these filters.
          </div>
        )}
        {games.length > 0 && (
          <div className="p-4 grid grid-cols-1 gap-4">
            {games.map((game) => (
              <div key={game.gameID} className="glass-panel rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <button
                    className="font-label-sm text-primary underline decoration-dotted underline-offset-2"
                    title={`${game.gameID} — Click to copy`}
                    onClick={() => copyToClipboard(game.gameID)}
                  >
                    Game ID: {game.gameID}
                  </button>
                  <span className="text-label-sm text-on-surface-variant shrink-0">{formatDate(game.createdAt)}</span>
                </div>

                <div className="text-sm">
                  <span className="text-on-surface-variant">Cube: </span>
                  <a
                    href={`https://cubecobra.com/cube/list/${game.cubeID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    title="Click to visit cube on CubeCobra"
                  >
                    {game.cubeID}
                  </a>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Player 1</span>
                      <p className="text-on-surface font-semibold">{game.player1Name}</p>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Player 2</span>
                      <p className="text-on-surface font-semibold">{game.player2Name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-label-sm transition-all"
                      onClick={() => navigate(`/deckbuilder/${encodeURIComponent(game.gameID)}/${encodeURIComponent(game.player1Name)}`)}
                    >
                      P1 Draftboard
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant/50 text-xs font-label-sm transition-all"
                      onClick={() => navigate(`/deckbuilder/${encodeURIComponent(game.gameID)}/${encodeURIComponent(game.player2Name)}`)}
                    >
                      P2 Draftboard
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
