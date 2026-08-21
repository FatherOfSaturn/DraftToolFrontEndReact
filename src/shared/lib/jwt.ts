export interface JwtPayload {
  [key: string]: unknown;
  email?: string;
  sub?: string;
}

/**
 * Decodes the payload of a JWT (the second dot-segment) without verifying
 * the signature. Only used to surface non-sensitive claims (like the user's
 * own email) that the backend no longer serializes on the Account DTO.
 * Returns null if the token is malformed or not a valid base64url payload.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Reads the `email` claim out of a JWT if present, otherwise undefined. */
export function emailFromJwt(token: string): string | undefined {
  const payload = decodeJwtPayload(token);
  const email = payload?.email;
  return typeof email === 'string' && email.trim().length > 0 ? email : undefined;
}
