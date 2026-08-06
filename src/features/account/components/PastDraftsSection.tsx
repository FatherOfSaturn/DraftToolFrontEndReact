import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../../shared/components/Pagination';
import { useToast } from '../../../shared/components/Toast';
import type { Pagination as PaginationState } from '../hooks/useGameHistory';
import type { GameHistoryEntry } from '../model/accountTypes';
import { buildDraftCardItem, type DraftPlayerRow } from './pastDraftsModel';

const GAME_TYPE_LABELS: Record<GameHistoryEntry['gameType'], string> = {
  pyramid: 'Pyramid',
  classic: 'Classic',
};

interface PastDraftsSectionProps {
  games: GameHistoryEntry[];
  pagination: PaginationState;
  currentPlayerNames?: string[];
  currentAccountID?: string;
}

function PlayerRow({ row, gameID }: { row: DraftPlayerRow; gameID: string }) {
  const navigate = useNavigate();

  const isCurrent = row.isCurrentPlayer;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border-l-4 px-3 py-2 ${
        isCurrent ? 'border-primary bg-primary/15' : 'border-transparent'
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${isCurrent ? 'text-primary font-bold' : 'text-on-surface font-semibold'}`}
          >
            {row.name}
          </span>
          {isCurrent && (
            <span className="text-[10px] uppercase tracking-wider font-label-sm font-bold text-primary bg-primary/30 border border-primary/60 px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <span className={`text-[11px] font-label-sm ${row.progressColor}`}>{row.progressLabel}</span>
      </div>
      {row.action && (
        <button
          className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-label-sm transition-all self-start"
          onClick={() =>
            navigate(
              `/${row.action!.target}/${encodeURIComponent(gameID)}/${encodeURIComponent(row.routeName)}`,
            )
          }
        >
          {row.action.label}
        </button>
      )}
    </div>
  );
}

function DraftCard({
  game,
  currentPlayerNames,
  currentAccountID,
}: {
  game: GameHistoryEntry;
  currentPlayerNames?: string[];
  currentAccountID?: string;
}) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const card = buildDraftCardItem(game, {
    playerNames: currentPlayerNames,
    accountID: currentAccountID,
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied Game ID')).catch(() => {});
  }

  return (
    <div className="glass-panel rounded-xl">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <button
          type="button"
          className="flex-1 text-left flex items-start justify-between gap-3 min-w-0"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-label-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">grid_view</span>
                {GAME_TYPE_LABELS[card.gameType] ?? card.gameType}
              </span>
              <span className={`font-label-sm ${card.statusColor} flex items-center gap-1`}>
                <span className="material-symbols-outlined text-[14px]">{card.statusIcon}</span>
                {card.statusLabel}
              </span>
              <span className="text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {card.dateLabel}
              </span>
              <span className="text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">groups</span>
                {card.playerCount} Player{card.playerCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-on-surface-variant">Cube: </span>
              <a
                href={`https://cubecobra.com/cube/list/${card.cubeID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                title="Click to visit cube on CubeCobra"
                onClick={(event) => event.stopPropagation()}
              >
                {card.cubeID}
              </a>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 flex-shrink-0 ${
              open ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>
        <button
          className="flex-shrink-0 text-label-sm text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
          title={`${card.gameID} — Click to copy`}
          onClick={() => copyToClipboard(card.gameID)}
        >
          <span className="material-symbols-outlined text-[14px]">content_copy</span>
          Copy Game ID
        </button>
      </div>

      {open && (
        <div className="border-t border-outline-variant/30 px-4 py-3 space-y-3">
          {card.players.map((row) => (
            <PlayerRow key={row.routeName} row={row} gameID={card.gameID} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PastDraftsSection({
  games,
  pagination,
  currentPlayerNames,
  currentAccountID,
}: PastDraftsSectionProps) {
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
              <DraftCard
                key={game.gameID}
                game={game}
                currentPlayerNames={currentPlayerNames}
                currentAccountID={currentAccountID}
              />
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
