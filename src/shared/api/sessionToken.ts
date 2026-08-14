const JWT_STORAGE_KEY = 'drafttool_jwt';
const PLAYER_TOKEN_KEY = 'lobby_player_token';

export function getSessionToken(): string | null {
  return sessionStorage.getItem(JWT_STORAGE_KEY);
}

export function setSessionToken(token: string | null): void {
  if (token === null) {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
  } else {
    sessionStorage.setItem(JWT_STORAGE_KEY, token);
  }
}

export function getLobbyPlayerToken(): string | null {
  return sessionStorage.getItem(PLAYER_TOKEN_KEY);
}
