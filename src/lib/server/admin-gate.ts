import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Pre-auth gate for the whole /admin section. When ADMIN_ACCESS_TOKEN is set,
 * unauthenticated admin requests 404 unless they present the token (as a
 * `?token=` query, which grants a long-lived httpOnly "door" cookie) or that
 * cookie. The secret lives only in the server env — never in the client
 * bundle, service worker, or any served asset — so unlike moving the URL,
 * nothing on the frontend can reveal that the admin section exists.
 */

export const ADMIN_GATE_COOKIE = "ruakh_admin_gate";
/** One year — the token URL is a once-per-browser ritual, not a login step. */
export const ADMIN_GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type AdminGateDecision =
  /** No token configured — gate off, behave as plain session auth. */
  | "disabled"
  /** Valid `?token=` presented — allow and (re)issue the door cookie. */
  | "grant"
  /** Valid door cookie — allow. */
  | "pass"
  /** No valid credential — respond 404 as if the route doesn't exist. */
  | "deny";

/** Constant-time string comparison; hashing first tolerates length mismatch. */
export function safeTokenEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function adminGateDecision(opts: {
  configuredToken: string | undefined;
  queryToken: string | null;
  cookieToken: string | undefined;
}): AdminGateDecision {
  const { configuredToken, queryToken, cookieToken } = opts;
  if (!configuredToken) return "disabled";
  // Query first: re-presenting the token always refreshes the door cookie,
  // and a stale bookmarked token can't lock out a browser with a valid cookie.
  if (queryToken && safeTokenEqual(queryToken, configuredToken)) return "grant";
  if (cookieToken && safeTokenEqual(cookieToken, configuredToken)) return "pass";
  return "deny";
}
