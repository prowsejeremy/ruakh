/**
 * In-process fixed-window rate limiter. No external store — one counter per key
 * held in a Map, which fits the single-container self-hosting story (a restart
 * resets counters, acceptable for load-shedding). Keyed by whatever the caller
 * passes (client IP for the public endpoints). Inject `now` in tests.
 */
export type RateLimitResult = {
  allowed: boolean;
  /** Requests still permitted in the current window (0 once blocked). */
  remaining: number;
  /** Seconds until the window resets — for a `Retry-After` header. */
  retryAfterSec: number;
};

type Entry = { count: number; resetAt: number };

export function createRateLimiter(opts: {
  /** Max requests permitted per key per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  now?: () => number;
}) {
  const { limit, windowMs } = opts;
  const now = opts.now ?? (() => Date.now());
  const hits = new Map<string, Entry>();

  // Drop expired entries so a churn of distinct IPs can't grow the Map without
  // bound; only swept once it gets large, so the common path stays O(1).
  function sweep(t: number): void {
    for (const [key, entry] of hits) if (entry.resetAt <= t) hits.delete(key);
  }

  return {
    check(key: string): RateLimitResult {
      const t = now();
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= t) {
        entry = { count: 0, resetAt: t + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      if (hits.size > 5000) sweep(t);

      const allowed = entry.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - entry.count),
        retryAfterSec: allowed ? 0 : Math.ceil((entry.resetAt - t) / 1000)
      };
    }
  };
}
