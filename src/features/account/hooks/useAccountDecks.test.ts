import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Deck } from '../model/accountTypes';

const { getDecks, deleteDeck } = vi.hoisted(() => ({
  getDecks: vi.fn(),
  deleteDeck: vi.fn(),
}));

vi.mock('../api/accountApi', () => ({
  accountApi: { getDecks, deleteDeck },
}));

import { useAccountDecks } from './useAccountDecks';

const deck: Deck = {
  deckID: 'deck-1',
  accountID: 'account-1',
  name: 'Test Deck',
  description: '',
  cardIds: [],
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

describe('useAccountDecks', () => {
  beforeEach(() => {
    getDecks.mockReset();
    deleteDeck.mockReset();
  });

  it('stays idle when no account is available', () => {
    const { result } = renderHook(() => useAccountDecks());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.decks).toEqual([]);
    expect(getDecks).not.toHaveBeenCalled();
  });

  it('loads and locally removes a deleted deck', async () => {
    getDecks.mockResolvedValue([deck]);
    deleteDeck.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { result } = renderHook(() => useAccountDecks('account-1'));
    await waitFor(() => expect(result.current.decks).toEqual([deck]));

    await act(() => result.current.deleteDeck('deck-1'));
    expect(deleteDeck).toHaveBeenCalledWith('account-1', 'deck-1');
    expect(result.current.decks).toEqual([]);
  });
});
