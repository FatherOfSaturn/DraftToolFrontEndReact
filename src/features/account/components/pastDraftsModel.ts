import type { GameHistoryEntry, GameHistoryPlayer, GameState } from '../model/accountTypes';

export type DraftActionTarget = 'draft' | 'deckbuilder' | 'classic-draft';

export interface DraftPlayerRow {
  name: string;
  /** Raw in-game player name used in route URLs (/draft, /deckbuilder, /classic-draft). */
  routeName: string;
  isCurrentPlayer: boolean;
  progressLabel: string;
  progressColor: string;
  action: { label: string; target: DraftActionTarget } | null;
}

export interface DraftCardItem {
  gameID: string;
  cubeID: string;
  gameType: GameHistoryEntry['gameType'];
  statusLabel: string;
  statusIcon: string;
  statusColor: string;
  dateLabel: string;
  playerCount: number;
  players: DraftPlayerRow[];
}

export function formatDraftDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace(',', '');
}

export function getGameBadge(
  gameState: GameState,
  allDone: boolean,
): { label: string; icon: string; color: string } {
  if (gameState === 'game_complete') {
    return { label: 'Complete', icon: 'check_circle', color: 'text-on-surface-variant' };
  }
  if (gameState === 'game_merged') {
    return { label: 'Round 2', icon: 'swap_horiz', color: 'text-secondary' };
  }
  if (allDone) {
    return { label: 'All done', icon: 'merge', color: 'text-tertiary' };
  }
  return { label: 'In Progress', icon: 'edit', color: 'text-primary' };
}

export function playerProgressLabel(current: number, total: number, done: boolean): string {
  if (done) return 'Done';
  if (total === 0) return '—';
  return `Pack ${current} of ${total}`;
}

export function playerProgressColor(done: boolean, opponentDone: boolean): string {
  if (done) return 'text-on-surface-variant';
  if (opponentDone) return 'text-secondary';
  return 'text-primary';
}

function playerDisplayName(player: GameHistoryPlayer): string | null {
  return player.displayName ?? player.name;
}

function isCurrentPlayer(
  player: GameHistoryPlayer,
  aliases: string[],
  accountID?: string,
): boolean {
  if (player.accountID && accountID) {
    return player.accountID === accountID;
  }
  const display = playerDisplayName(player);
  if (!display) return false;
  return aliases.includes(display.trim().toLowerCase());
}

function playerActionFor(
  entry: GameHistoryEntry,
  player: GameHistoryPlayer,
  opponentDone: boolean,
): DraftPlayerRow['action'] {
  switch (entry.gameType) {
    case 'pyramid': {
      if (entry.gameState === 'game_complete') {
        return { label: 'Draftboard', target: 'deckbuilder' };
      }
      if (entry.gameState === 'game_merged') {
        return { label: 'Round 2', target: 'draft' };
      }
      if (!player.doneDrafting) {
        return { label: 'Continue Drafting', target: 'draft' };
      }
      if (player.doneDrafting && opponentDone) {
        return { label: 'Draftboard', target: 'deckbuilder' };
      }
      return null;
    }
    case 'classic': {
      const complete = entry.gameState === 'game_complete';
      if (!player.doneDrafting && !complete) {
        return { label: 'Continue Drafting', target: 'classic-draft' };
      }
      if (player.doneDrafting && complete) {
        return { label: 'Draftboard', target: 'deckbuilder' };
      }
      return null;
    }
    default:
      return null;
  }
}

export interface BuildDraftCardOptions {
  /** Aliases (display name, email, ...) for the logged-in player; used when a player has no accountID. */
  playerNames?: string[];
  /** Account ID of the logged-in player; primary match when players carry an accountID. */
  accountID?: string;
}

/**
 * Normalizes a unified GameHistoryEntry (any draft type) into the shared
 * draft-card shape. Progress is rendered as "Pack X of Y" for both types:
 * pyramid's currentPack is a 0-based count of completed packs (so pack = +1),
 * classic's currentPack is the 1-based pack number directly.
 */
export function buildDraftCardItem(
  entry: GameHistoryEntry,
  options: BuildDraftCardOptions = {},
): DraftCardItem {
  const aliases = (options.playerNames ?? [])
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .map((name) => name.trim().toLowerCase());

  const players: DraftPlayerRow[] = [];
  entry.players.forEach((player, index) => {
    const display = playerDisplayName(player);
    if (!display) return;

    const opponentDone = entry.players.some((other, i) => i !== index && other.doneDrafting);
    const pack =
      entry.gameType === 'pyramid'
        ? Math.min(player.currentPack + 1, player.totalPacks)
        : player.currentPack;

    players.push({
      name: display,
      routeName: player.name ?? display,
      isCurrentPlayer: isCurrentPlayer(player, aliases, options.accountID),
      progressLabel: playerProgressLabel(pack, player.totalPacks, player.doneDrafting),
      progressColor: playerProgressColor(player.doneDrafting, opponentDone),
      action: playerActionFor(entry, player, opponentDone),
    });
  });

  const allDone =
    entry.players.length > 0 && entry.players.every((p) => p.doneDrafting);
  const badge = getGameBadge(entry.gameState, allDone);

  return {
    gameID: entry.gameID,
    cubeID: entry.cubeID,
    gameType: entry.gameType,
    statusLabel: badge.label,
    statusIcon: badge.icon,
    statusColor: badge.color,
    dateLabel: formatDraftDate(entry.createdAt),
    playerCount: entry.players.length,
    players,
  };
}
