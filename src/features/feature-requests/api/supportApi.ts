import { requestJson, requestVoid } from '../../../shared/api/httpClient';

export type SupportType = 'new_feature' | 'bug_fix' | 'misc_support';

export type SupportStatus = 'new' | 'in_progress' | 'blocked' | 'completed' | 'deleted';

export interface CreateSupportRequest {
  title: string;
  description: string;
  contactEmail: string;
  priority: string;
  type: SupportType;
  /**
   * Honeypot field. Real users never fill it in; always send it (empty
   * string). A non-empty value makes the backend silently drop the ticket
   * while returning a normal-looking success.
   */
  website: string;
  /**
   * Anti-spam token from GET /support/form-token. Fetched on form mount;
   * the backend ignores it while anti-spam mode is `off`/`report-only`.
   */
  formToken?: string;
  /**
   * Cloudflare Turnstile token. Present only when the Turnstile widget is
   * enabled (VITE_TURNSTILE_SITE_KEY set) and the user has completed it.
   */
  'cf-turnstile-response'?: string;
}

/**
 * The backend deliberately returns only the ticket ID from create: the old
 * response echoed PII and ticket metadata back to an anonymous caller.
 */
export interface CreateSupportResponse {
  id: string;
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

export interface FormTokenResponse {
  token: string;
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
  create(req: CreateSupportRequest): Promise<CreateSupportResponse> {
    return requestJson<CreateSupportResponse>('/support/', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /**
   * Short-lived HMAC-signed form token (valid 3 s – 2 h after issuance).
   * Fetch on form mount; refetch and retry once if the submit fails with a
   * token-related 400.
   */
  getFormToken(): Promise<FormTokenResponse> {
    return requestJson<FormTokenResponse>('/support/form-token');
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
