function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const env = {
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  useMockGameApi: import.meta.env.VITE_USE_MOCK_API === 'true',
  skipAuth: import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true',
} as const;
