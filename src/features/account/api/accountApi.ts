import type { Account, Deck, GameSummary } from '../model/accountTypes';
import { requestJson, requestVoid } from '../../../shared/api/httpClient';

const segment = encodeURIComponent;

function normalizeGameSummary(game: GameSummary): GameSummary {
  return {
    ...game,
    gameState: game.gameState.toLowerCase() as GameSummary['gameState'],
  };
}

export const accountApi = {
  login(idToken: string): Promise<Account> {
    return requestJson<Account>('/account/login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  getAccount(accountID: string): Promise<Account> {
    return requestJson<Account>(`/account/${segment(accountID)}`);
  },

  updateDisplayName(accountID: string, displayName: string): Promise<void> {
    return requestVoid(`/account/${segment(accountID)}`, {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    });
  },

  getDecks(accountID: string): Promise<Deck[]> {
    return requestJson<Deck[]>(`/account/${segment(accountID)}/decks`);
  },

  createDeck(
    accountID: string,
    name: string,
    description: string,
    cardIds: string[]
  ): Promise<void> {
    return requestVoid(`/account/${segment(accountID)}/decks`, {
      method: 'POST',
      body: JSON.stringify({ name, description, cardIds }),
    });
  },

  updateDeck(
    accountID: string,
    deckID: string,
    name: string,
    description: string,
    cardIds: string[]
  ): Promise<void> {
    return requestVoid(`/account/${segment(accountID)}/decks/${segment(deckID)}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, cardIds }),
    });
  },

  deleteDeck(accountID: string, deckID: string): Promise<void> {
    return requestVoid(`/account/${segment(accountID)}/decks/${segment(deckID)}`, {
      method: 'DELETE',
    });
  },

  getGameHistory(accountID: string): Promise<GameSummary[]> {
    return requestJson<GameSummary[]>(`/game/history/${segment(accountID)}`).then((games) =>
      games.map(normalizeGameSummary)
    );
  },
};
