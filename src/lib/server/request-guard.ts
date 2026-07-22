/**
 * Request-inspection helpers for public API endpoints. These are deterrents
 * against casual scraping / cross-site use, NOT a confidentiality boundary —
 * the bundle content is public. A determined caller can forge headers.
 */

/**
 * True when the request looks like a same-origin browser `fetch` from the app
 * itself. `Sec-Fetch-Site` is set by the browser (not forgeable from page JS)
 * and is `same-origin`/`same-site` for our own fetches; address-bar
 * navigations send `none`, other sites send `cross-site`, and non-browser
 * clients (curl, scripts) omit it entirely — all rejected.
 */
export function isSameOriginBrowserRequest(request: Pick<Request, 'headers'>): boolean {
  const site = request.headers.get('sec-fetch-site');
  return site === 'same-origin' || site === 'same-site';
}

/**
 * True only when the browser explicitly tags the request `cross-site`. For
 * write endpoints the service worker also calls (push subscribe): an SW fetch
 * may arrive without `Sec-Fetch-Site`, so we can't require `same-origin` there
 * (that would break silent push re-subscription) — but we can still reject the
 * one value that marks a genuine cross-site caller. Curl/script abuse on those
 * writes is bounded by their payload validation and the rate limiter instead.
 */
export function isCrossSiteRequest(request: Pick<Request, 'headers'>): boolean {
  return request.headers.get('sec-fetch-site') === 'cross-site';
}

/**
 * Best-effort client IP for rate-limit keying, behind our nginx proxy. nginx
 * overwrites `X-Real-IP` with the real peer address (so it can't be spoofed by
 * the client), so it's preferred; `X-Forwarded-For`'s first hop and the
 * adapter's own `getClientAddress()` are fallbacks (e.g. the dev proxy).
 */
export function clientIp(headers: Headers, fallback: string): string {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return fallback;
}
