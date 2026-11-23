import { env } from '../../config/env';
import { getSessionToken } from './sessionToken';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly method: string,
    public readonly path: string,
    details: string,
    /** Value of the `Retry-After` response header in seconds, when present. */
    public readonly retryAfterSeconds?: number
  ) {
    super(`${method} ${path} failed: ${status}${details ? ` ${details}` : ''}`);
    this.name = 'ApiError';
  }
}

export function apiUrl(path: string): string {
  return `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getSessionToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), { ...init, headers });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader !== null ? Number(retryAfterHeader) : undefined;
    throw new ApiError(
      response.status,
      init.method ?? 'GET',
      path,
      details,
      retryAfterSeconds !== undefined && !Number.isNaN(retryAfterSeconds) ? retryAfterSeconds : undefined
    );
  }
  return response;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, init);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  await request(path, init);
}
