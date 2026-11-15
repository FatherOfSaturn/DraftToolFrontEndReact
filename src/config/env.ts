function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const env = {
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  useMockGameApi: import.meta.env.VITE_USE_MOCK_API === 'true',
  skipAuth: import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true',
  /**
   * Cloudflare Turnstile site key for the support form. When set, the
   * Turnstile widget is rendered and its token is required on submit
   * (the backend ignores it while anti-spam mode is `off`/`report-only`).
   * Its presence is the frontend's own toggle for the anti-spam Phase 2.
   */
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '',
} as const;
