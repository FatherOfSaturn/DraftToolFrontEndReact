import { requestJson } from '../../../shared/api/httpClient';
import { supportApi } from '../../feature-requests/api/supportApi';
import type { AdminCheck, DonationStats } from '../model/adminTypes';

export { supportApi };

const segment = encodeURIComponent;

export const adminApi = {
  checkAdmin(accountID: string): Promise<AdminCheck> {
    return requestJson<AdminCheck>(`/admin/check/${segment(accountID)}`);
  },

  getDonationStats(): Promise<DonationStats> {
    return requestJson<DonationStats>('/admin/stats/donations');
  },

  getDraftTypeCount(draftType: string): Promise<number> {
    return requestJson<number>(`/admin/stats/drafts/${segment(draftType)}`);
  },
};
