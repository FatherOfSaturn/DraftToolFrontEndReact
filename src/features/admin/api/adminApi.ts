import { requestJson } from '../../../shared/api/httpClient';
import { supportApi } from '../../feature-requests/api/supportApi';
import type { AdminCheck, DonationStats } from '../model/adminTypes';

export { supportApi };

const segment = encodeURIComponent;

export const adminApi = {
  checkAdmin(accountID: string): Promise<AdminCheck> {
    return requestJson<AdminCheck>(`/admin/check/${segment(accountID)}`);
  },

  getDonationStats(accountID: string): Promise<DonationStats> {
    return requestJson<DonationStats>(`/admin/${segment(accountID)}/stats/donations`);
  },

  getDraftTypeCount(accountID: string, draftType: string): Promise<number> {
    return requestJson<number>(`/admin/${segment(accountID)}/stats/drafts/${segment(draftType)}`);
  },
};
