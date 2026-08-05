import { requestJson, requestVoid } from '../../../shared/api/httpClient';

export type SupportType = 'new_feature' | 'bug_fix' | 'misc_support';

export type SupportStatus = 'new' | 'in_progress' | 'blocked' | 'completed';

export interface CreateSupportRequest {
  title: string;
  description: string;
  contactEmail: string;
  priority: string;
  accountID: string | null;
  type: SupportType;
}

export interface SupportRequest {
  id: string;
  title: string;
  description: string;
  contactEmail: string;
  priority: string;
  accountID: string | null;
  status: SupportStatus;
  type: SupportType;
  createdOnDate: string;
  lastStatusChangeDate: string;
}

export const supportApi = {
  create(req: CreateSupportRequest): Promise<SupportRequest> {
    return requestJson<SupportRequest>('/support/', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getAll(): Promise<SupportRequest[]> {
    return requestJson<SupportRequest[]>('/support/');
  },

  delete(id: string): Promise<void> {
    return requestVoid(`/support/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
