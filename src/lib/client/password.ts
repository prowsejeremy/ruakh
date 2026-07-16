const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * A copy/paste-safe random password (`A-Z a-z 0-9`) for admin accounts.
 * Modulo over each random byte is acceptable here: the value is immediately
 * re-hashed server-side with a per-password salt, so the negligible bias over
 * a 62-char alphabet is irrelevant. Browser/Node `crypto.getRandomValues`.
 */
export function randomPassword(length = 24): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}
