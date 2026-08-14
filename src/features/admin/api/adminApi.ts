import { requestJson, requestVoid } from '../../../shared/api/httpClient';
import { supportApi } from '../../feature-requests/api/supportApi';
import type { AdminCheck, DonationStats } from '../model/adminTypes';
import type { Account, Deck, GameHistoryEntry } from '../../account/model/accountTypes';

export { supportApi };

const segment = encodeURIComponent;

export const adminApi = {
  /** GET /admin/check — admin gate; identity from the caller's JWT. */
  checkAdmin(): Promise<AdminCheck> {
    return requestJson<AdminCheck>('/admin/check');
  },

  /** GET /admin/stats/donations — identity from the caller's JWT. */
  getDonationStats(): Promise<DonationStats> {
    return requestJson<DonationStats>('/admin/stats/donations');
  },

  /** GET /admin/stats/drafts/{draftType} — identity from the caller's JWT. */
  getDraftTypeCount(draftType: string): Promise<number> {
    return requestJson<number>(`/admin/stats/drafts/${segment(draftType)}`);
  },

  // Cross-account admin lookup. Identity comes from the caller's JWT; the
  // backend resolves the target by path accountID. Contract documented in
  // docs/BACKEND_SECURITY_SPEC.md §13.

  getAccountByID(accountID: string): Promise<Account> {
    return requestJson<Account>(`/admin/accounts/${segment(accountID)}`);
  },

  getGameHistoryByID(accountID: string): Promise<GameHistoryEntry[]> {
    return requestJson<GameHistoryEntry[]>(`/admin/accounts/${segment(accountID)}/game/history`);
  },

  getDecksByID(accountID: string): Promise<Deck[]> {
    return requestJson<Deck[]>(`/admin/accounts/${segment(accountID)}/decks`);
  },

  deleteDeckByID(accountID: string, deckID: string): Promise<void> {
    return requestVoid(`/admin/accounts/${segment(accountID)}/decks/${segment(deckID)}`, {
      method: 'DELETE',
    });
  },

  /** DELETE /admin/games/{gameState} — deletes every game in the given state. */
  deleteGamesWithStatus(gameState: string): Promise<void> {
    return requestVoid(`/admin/games/${segment(gameState)}`, {
      method: 'DELETE',
    });
  },
};
