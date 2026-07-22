import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildContentBundle } from '$lib/server/content-bundle';
import { hashBundle } from '$lib/bundle-hash';
import { isSameOriginBrowserRequest, clientIp } from '$lib/server/request-guard';
import { createRateLimiter } from '$lib/server/rate-limit';

// Per-IP cap. Generous for real use — the app fetches this only a few times a
// session (home mount + install) and mostly revalidates to 304 — but bounds the
// DB load a scraper can generate, since every hit runs the bundle queries even
// for a 304. Module scope: one shared limiter for the process's lifetime.
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const limiter = createRateLimiter({ limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS });

/**
 * Public content snapshot for full offline use. No personal data.
 * Strong ETag = content hash: unchanged content revalidates to 304 (no body),
 * so an installed device only re-downloads after an admin actually amends
 * something. `no-cache` = the browser always revalidates rather than serving
 * a stale copy blindly (cheap when unchanged).
 *
 * Access is fenced to the app itself: only same-origin browser fetches pass
 * (address-bar hits, cross-site fetches and non-browser clients are refused),
 * and each client IP is rate-limited. Both are deterrents against casual
 * scraping / stray load — the content is public, not a confidentiality gate.
 */
export const GET: RequestHandler = async ({ request, getClientAddress }) => {
  if (!isSameOriginBrowserRequest(request)) error(403, 'Forbidden');

  const { allowed, retryAfterSec } = limiter.check(clientIp(request.headers, getClientAddress()));
  if (!allowed) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'retry-after': String(retryAfterSec) }
    });
  }

  const bundle = await buildContentBundle(new Date());
  const etag = `"${hashBundle(bundle)}"`;

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { etag, 'cache-control': 'no-cache' } });
  }
  return json(bundle, { headers: { etag, 'cache-control': 'no-cache' } });
};
