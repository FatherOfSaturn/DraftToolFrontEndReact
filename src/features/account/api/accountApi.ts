import type { Account, Deck, GameHistoryEntry, LoginResponse } from '../model/accountTypes';
import { requestJson, requestVoid } from '../../../shared/api/httpClient';

const segment = encodeURIComponent;

function normalizeGameHistoryEntry(game: GameHistoryEntry): GameHistoryEntry {
  return {
    ...game,
    gameState: game.gameState.toLowerCase() as GameHistoryEntry['gameState'],
  };
}

export const accountApi = {
  login(idToken: string): Promise<LoginResponse> {
    return requestJson<LoginResponse>('/account/login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  logout(): Promise<void> {
    return requestVoid('/account/logout', { method: 'POST' });
  },

  // The backend derives the caller's identity from the JWT (never from the
  // URL), so account-scoped endpoints carry no accountID in the path.

  getAccount(): Promise<Account> {
    return requestJson<Account>('/account/');
  },

  updateDisplayName(displayName: string): Promise<void> {
    return requestVoid('/account/', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    });
  },

  getDecks(): Promise<Deck[]> {
    return requestJson<Deck[]>('/account/decks');
  },

  createDeck(
    name: string,
    description: string,
    cardIds: string[]
  ): Promise<void> {
    return requestVoid('/account/decks', {
      method: 'POST',
      body: JSON.stringify({ name, description, cardIds }),
    });
  },

  updateDeck(
    deckID: string,
    name: string,
    description: string,
    cardIds: string[]
  ): Promise<void> {
    return requestVoid(`/account/decks/${segment(deckID)}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, cardIds }),
    });
  },

  deleteDeck(deckID: string): Promise<void> {
    return requestVoid(`/account/decks/${segment(deckID)}`, {
      method: 'DELETE',
    });
  },

  getGameHistory(): Promise<GameHistoryEntry[]> {
    return requestJson<GameHistoryEntry[]>('/account/game/history').then(
      (games) => games.map(normalizeGameHistoryEntry)
    );
  },
};
