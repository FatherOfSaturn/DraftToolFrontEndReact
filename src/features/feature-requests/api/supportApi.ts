import { requestJson, requestVoid } from '../../../shared/api/httpClient';

export type SupportType = 'new_feature' | 'bug_fix' | 'misc_support';

export type SupportStatus = 'new' | 'in_progress' | 'blocked' | 'completed' | 'deleted';

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

/**
 * PII-free view returned by the public endpoints (`/support/public`,
 * `GET /support/{id}`). The backend deliberately omits `contactEmail` and
 * `accountID`.
 */
export type PublicSupportRequest = Omit<SupportRequest, 'contactEmail' | 'accountID'>;

/**
 * The backend serializes its support enums by name (e.g. "IN_PROGRESS",
 * "NEW_FEATURE", "HIGH"), while this client uses the lowercase description
 * values. Normalize every response so consumers always see lowercase values.
 */
export function normalizeSupportRequest(req: SupportRequest): SupportRequest {
  return {
    ...req,
    status: req.status.toLowerCase() as SupportStatus,
    type: req.type.toLowerCase() as SupportType,
    priority: req.priority.toLowerCase(),
  };
}

export const supportApi = {
  create(req: CreateSupportRequest): Promise<SupportRequest> {
    return requestJson<SupportRequest>('/support/', {
      method: 'POST',
      body: JSON.stringify(req),
    }).then(normalizeSupportRequest);
  },

  getAll(): Promise<SupportRequest[]> {
    return requestJson<SupportRequest[]>('/support/').then((data) => data.map(normalizeSupportRequest));
  },

  /** Public backlog — anonymous-safe, no PII. See backend /support/public. */
  getPublic(): Promise<PublicSupportRequest[]> {
    return requestJson<PublicSupportRequest[]>('/support/public').then((data) =>
      data.map((req) => normalizeSupportRequest(req as SupportRequest))
    );
  },

  updateStatus(id: string, status: SupportStatus): Promise<SupportRequest> {
    return requestJson<SupportRequest>(`/support/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then(normalizeSupportRequest);
  },

  delete(id: string): Promise<void> {
    return requestVoid(`/support/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
