import { createHash, randomBytes } from 'node:crypto';

/**
 * Personal access tokens for the MCP server. The raw token is shown to the user
 * exactly once; we persist only its SHA-256 hash, so a database leak never
 * exposes a usable credential. Format: `sf_` + 32 random bytes (base64url).
 */

const PREFIX = 'sf_';

export function generateApiToken(): string {
  return PREFIX + randomBytes(32).toString('base64url');
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Quick shape check before we bother hashing/looking up a presented token. */
export function looksLikeApiToken(token: string): boolean {
  return token.startsWith(PREFIX) && token.length >= PREFIX.length + 20;
}
