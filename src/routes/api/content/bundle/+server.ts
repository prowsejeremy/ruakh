import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildContentBundle } from '$lib/server/content-bundle';
import { hashBundle } from '$lib/bundle-hash';

/**
 * Public content snapshot for full offline use. No personal data.
 * Strong ETag = content hash: unchanged content revalidates to 304 (no body),
 * so an installed device only re-downloads after an admin actually amends
 * something. `no-cache` = the browser always revalidates rather than serving
 * a stale copy blindly (cheap when unchanged).
 */
export const GET: RequestHandler = async ({ request }) => {
  const bundle = await buildContentBundle(new Date());
  const etag = `"${hashBundle(bundle)}"`;

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { etag, 'cache-control': 'no-cache' } });
  }
  return json(bundle, { headers: { etag, 'cache-control': 'no-cache' } });
};
