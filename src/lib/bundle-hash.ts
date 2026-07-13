import { createHash } from 'node:crypto';
import type { ContentBundle } from './server/content-bundle';

/**
 * Strong content hash of a bundle, EXCLUDING generatedAt (which changes on
 * every build and would defeat caching). Two bundles with identical content
 * produce the same hash; any edit/insert/delete/reorder changes it. Server-only
 * (node:crypto) — the client never imports this.
 */
export function hashBundle(bundle: ContentBundle): string {
  const { reflections, pages, themes } = bundle;
  const canonical = JSON.stringify({ reflections, pages, themes });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}
