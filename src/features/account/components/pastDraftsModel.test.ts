import { describe, expect, it } from 'vitest';
import type { GameHistoryEntry, GameHistoryPlayer, GameState } from '../model/accountTypes';
import {
  buildDraftCardItem,
  getGameBadge,
  playerProgressColor,
  playerProgressLabel,
} from './pastDraftsModel';

function player(overrides: Partial<GameHistoryPlayer> = {}): GameHistoryPlayer {
  return {
    name: 'Alice',
    displayName: null,
    accountID: null,
    currentPack: 0,
    totalPacks: 20,
    doneDrafting: false,
    cardsLeftToDraft: null,
    draftOrderNumber: null,
    ...overrides,
  };
}

function entry(overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry {
  return {
    gameID: 'game-1',
    cubeID: 'cube-1',
    gameType: 'pyramid',
    gameState: 'game_in_progress',
    players: [],
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

describe('getGameBadge', () => {
  it('maps game states to labels', () => {
    expect(getGameBadge('game_complete', false).label).toBe('Complete');
    expect(getGameBadge('game_merged', false).label).toBe('Round 2');
    expect(getGameBadge('game_created', false).label).toBe('In Progress');
  });

  it('shows "All done" when every player finished drafting', () => {
    expect(getGameBadge('game_in_progress', true).label).toBe('All done');
  });
});

describe('playerProgressLabel', () => {
  it('returns Done for finished players', () => {
    expect(playerProgressLabel(3, 3, true)).toBe('Done');
  });

  it('reports current pack against total', () => {
    expect(playerProgressLabel(1, 3, false)).toBe('Pack 1 of 3');
  });

  it('handles zero-total games', () => {
    expect(playerProgressLabel(0, 0, false)).toBe('—');
  });
});

describe('playerProgressColor', () => {
  it('uses the opponent-done color when waiting', () => {
    expect(playerProgressColor(false, true)).toBe('text-secondary');
    expect(playerProgressColor(true, false)).toBe('text-on-surface-variant');
    expect(playerProgressColor(false, false)).toBe('text-primary');
  });
});

describe('buildDraftCardItem — pyramid', () => {
  const game = entry({
    gameType: 'pyramid',
    players: [
      player({ name: 'Alice', accountID: 'acc-1', currentPack: 0 }),
      player({ name: 'Bob', accountID: 'acc-2', currentPack: 5, doneDrafting: true }),
    ],
  });

  it('maps into the shared card shape with 0-based pack progress', () => {
    const card = buildDraftCardItem(game, { accountID: 'acc-1' });
    expect(card.gameType).toBe('pyramid');
    expect(card.gameID).toBe('game-1');
    expect(card.cubeID).toBe('cube-1');
    expect(card.statusLabel).toBe('In Progress');
    expect(card.playerCount).toBe(2);
    expect(card.players[0]).toMatchObject({ name: 'Alice', progressLabel: 'Pack 1 of 20' });
    expect(card.players[1]).toMatchObject({ name: 'Bob', progressLabel: 'Done' });
  });

  it('offers Continue Drafting while not done, hides the button while waiting, and Draftboard once both are done', () => {
    const ongoing = buildDraftCardItem(game, { accountID: 'acc-1' });
    expect(ongoing.players[0].action).toEqual({ label: 'Continue Drafting', target: 'draft' });
    expect(ongoing.players[1].action).toBeNull();

    const complete = buildDraftCardItem(
      entry({
        gameType: 'pyramid',
        gameState: 'game_complete',
        players: [
          player({ name: 'Alice', accountID: 'acc-1', doneDrafting: true }),
          player({ name: 'Bob', accountID: 'acc-2', doneDrafting: true }),
        ],
      }),
    );
    expect(complete.players[0].action).toEqual({ label: 'Draftboard', target: 'deckbuilder' });
  });

  it('routes merged games back into the draft', () => {
    const merged = buildDraftCardItem(
      entry({
        gameType: 'pyramid',
        gameState: 'game_merged',
        players: [player({ name: 'Alice' }), player({ name: 'Bob' })],
      }),
    );
    expect(merged.players[0].action).toEqual({ label: 'Round 2', target: 'draft' });
  });
});

describe('buildDraftCardItem — classic', () => {
  it('uses 1-based pack progress and classic continue/draftboard actions', () => {
    const inProgress = buildDraftCardItem(
      entry({
        gameType: 'classic',
        gameState: 'game_in_progress',
        players: [
          player({ name: 'Alice', accountID: 'acc-1', currentPack: 2, totalPacks: 3 }),
          player({ name: 'Bob', accountID: 'acc-2', currentPack: 3, totalPacks: 3, doneDrafting: true }),
        ],
      }),
      { accountID: 'acc-1' },
    );
    expect(inProgress.players[0].progressLabel).toBe('Pack 2 of 3');
    expect(inProgress.players[1].progressLabel).toBe('Done');
    expect(inProgress.players[0].action).toEqual({ label: 'Continue Drafting', target: 'classic-draft' });
    expect(inProgress.players[1].action).toBeNull();
  });

  it('offers the draftboard once the game is complete', () => {
    const complete = buildDraftCardItem(
      entry({
        gameType: 'classic',
        gameState: 'game_complete',
        players: [
          player({ name: 'Alice', accountID: 'acc-1', currentPack: 3, totalPacks: 3, doneDrafting: true }),
          player({ name: 'Bob', accountID: 'acc-2', currentPack: 3, totalPacks: 3, doneDrafting: true }),
        ],
      }),
    );
    expect(complete.players[0].action).toEqual({ label: 'Draftboard', target: 'deckbuilder' });
  });

  it('uses routeName from the in-game name and displays the friendly name', () => {
    const card = buildDraftCardItem(
      entry({
        gameType: 'classic',
        players: [
          player({ name: 'alice', displayName: 'Alice Smith', accountID: 'acc-1' }),
        ],
      }),
    );
    expect(card.players[0]).toMatchObject({ name: 'Alice Smith', routeName: 'alice' });
  });
});

describe('buildDraftCardItem — current player detection', () => {
  it('matches by accountID when both sides have one', () => {
    const game = entry({
      gameType: 'classic',
      players: [
        player({ name: 'Alice', accountID: 'acc-1' }),
        player({ name: 'Bob', accountID: 'acc-2' }),
      ],
    });
    const card = buildDraftCardItem(game, { accountID: 'acc-2' });
    expect(card.players[0].isCurrentPlayer).toBe(false);
    expect(card.players[1].isCurrentPlayer).toBe(true);
  });

  it('falls back to name aliases for guests without an accountID', () => {
    const game = entry({
      players: [
        player({ name: 'Alice', accountID: null }),
        player({ name: 'Bob', accountID: 'acc-2' }),
      ],
    });
    const card = buildDraftCardItem(game, { playerNames: ['alice'], accountID: 'acc-2' });
    expect(card.players[0].isCurrentPlayer).toBe(true);
    expect(card.players[1].isCurrentPlayer).toBe(true);
  });

  it('highlights nobody when no identity is provided', () => {
    const card = buildDraftCardItem(entry({ players: [player({ name: 'Alice' })] }));
    expect(card.players[0].isCurrentPlayer).toBe(false);
  });
});

describe('buildDraftCardItem — legacy and unknown', () => {
  it('shows a dash for legacy pyramid games with zero total packs', () => {
    const card = buildDraftCardItem(
      entry({
        players: [player({ name: 'Alice', totalPacks: 0 }), player({ name: 'Bob', totalPacks: 0 })],
      }),
    );
    expect(card.players[0].progressLabel).toBe('—');
  });

  it('skips players with no name at all', () => {
    const card = buildDraftCardItem(
      entry({
        players: [
          { name: null, displayName: null, accountID: null, currentPack: 0, totalPacks: 0, doneDrafting: false, cardsLeftToDraft: null, draftOrderNumber: null },
          player({ name: 'Bob' }),
        ],
      }),
    );
    expect(card.players).toHaveLength(1);
    expect(card.players[0].name).toBe('Bob');
  });

  it('degrades safely for unknown future game types', () => {
    const future = entry({ gameType: 'draft' as GameHistoryEntry['gameType'], gameState: 'game_in_progress' as GameState });
    const card = buildDraftCardItem(future);
    expect(card.gameType).toBe('draft');
    expect(card.players).toEqual([]);
  });
});
