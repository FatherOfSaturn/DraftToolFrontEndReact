import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../../shared/components/Pagination';
import { useToast } from '../../../shared/components/Toast';
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

function getGameBadge(game: GameSummary): { label: string; icon: string; color: string } {
  if (game.gameState === 'game_complete') {
    return { label: 'Complete', icon: 'check_circle', color: 'text-on-surface-variant' };
  }
  if (game.gameState === 'game_merged') {
    return { label: 'Round 2', icon: 'swap_horiz', color: 'text-secondary' };
  }
  if (game.player1DoneDrafting && game.player2DoneDrafting) {
    return { label: 'Both done', icon: 'merge', color: 'text-tertiary' };
  }
  return { label: 'In Progress', icon: 'edit', color: 'text-primary' };
}

function playerProgressLabel(current: number, total: number, done: boolean): string {
  if (done) return 'Done';
  if (total === 0) return '—';
  return `Pack ${current} of ${total}`;
}

function playerProgressColor(done: boolean, opponentDone: boolean): string {
  if (done) return 'text-on-surface-variant';
  if (opponentDone) return 'text-secondary';
  return 'text-primary';
}

function playerAction(
  gameState: GameSummary['gameState'],
  done: boolean,
  opponentDone: boolean,
): { label: string; target: 'draft' | 'deckbuilder' } | null {
  if (gameState === 'game_complete') {
    return { label: 'Draftboard', target: 'deckbuilder' };
  }
  if (gameState === 'game_merged') {
    return { label: 'Round 2', target: 'draft' };
  }
  if (!done) {
    return { label: 'Continue Drafting', target: 'draft' };
  }
  if (done && opponentDone) {
    return { label: 'Draftboard', target: 'deckbuilder' };
  }
  return null;
}

function PlayerRow({
  game,
  name,
  currentPack,
  totalPacks,
  done,
  opponentDone,
}: {
  game: GameSummary;
  name: string;
  currentPack: number;
  totalPacks: number;
  done: boolean;
  opponentDone: boolean;
}) {
  const navigate = useNavigate();
  const action = playerAction(game.gameState, done, opponentDone);
  const progress = playerProgressLabel(currentPack, totalPacks, done);
  const color = playerProgressColor(done, opponentDone);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <div className="flex flex-col">
        <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">Player</span>
        <p className="text-on-surface font-semibold text-sm">{name}</p>
        <span className={`text-[11px] font-label-sm ${color}`}>{progress}</span>
      </div>
      {action && (
        <button
          className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-label-sm transition-all self-start"
          onClick={() =>
            navigate(
              `/${action.target}/${encodeURIComponent(game.gameID)}/${encodeURIComponent(name)}`,
            )
          }
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function PastDraftsSection({ games, pagination }: PastDraftsSectionProps) {
  const { showToast } = useToast();

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied Game ID')).catch(() => {});
  }

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
            {games.map((game) => {
              const badge = getGameBadge(game);

              return (
                <div key={game.gameID} className="glass-panel rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <button
                      className="font-label-sm text-primary underline decoration-dotted underline-offset-2"
                      title={`${game.gameID} — Click to copy`}
                      onClick={() => copyToClipboard(game.gameID)}
                    >
                      Click to copy Game ID
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={`font-label-sm ${badge.color} flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                        {badge.label}
                      </span>
                      <span className="text-label-sm text-on-surface-variant shrink-0">{formatDate(game.createdAt)}</span>
                    </div>
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

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-6">
                      <PlayerRow
                        game={game}
                        name={game.player1Name}
                        currentPack={game.player1CurrentPack}
                        totalPacks={game.player1TotalPacks}
                        done={game.player1DoneDrafting}
                        opponentDone={game.player2DoneDrafting}
                      />
                      <PlayerRow
                        game={game}
                        name={game.player2Name}
                        currentPack={game.player2CurrentPack}
                        totalPacks={game.player2TotalPacks}
                        done={game.player2DoneDrafting}
                        opponentDone={game.player1DoneDrafting}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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
