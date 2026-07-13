import { getPublishedReflections, toReflectionView } from './db/reflections';
import { getAllPages } from './db/pages';
import { getThemes } from './db/themes';
import type { ReflectionView } from '$lib/types';

export type BundleTheme = {
  id: number;
  name: string;
  bg: string;
  line: string;
  ink: string;
  sort: number;
};

export type ContentBundle = {
  reflections: ReflectionView[];
  pages: { uri: string; content: string }[];
  themes: BundleTheme[];
  generatedAt: string;
};

/**
 * The full public content set for offline use. `reflections` are in the SAME stable
 * order the server selects from, so the client's selectDailyReflection() matches the
 * server day-for-day — the daily "schedule" is this order + the pure function,
 * not a stored table.
 *
 * Divergence contract: editing the published set (unpublish/delete) reshuffles
 * the date→reflection mapping everywhere — that's inherent to `dayNumber % length`
 * and true online too. An offline device keeps its cached snapshot until its
 * next online launch refreshes the bundle; a temporary disagreement window is
 * accepted by design (a personal ritual, not a synchronized feed).
 *
 * `pages` are carried for future offline use (the /[uri] shell is currently
 * served from the SW page cache); no client reads them yet. `themes` power the
 * preferences theme picker offline and ride the same cache.
 */
export async function buildContentBundle(now: Date): Promise<ContentBundle> {
  const published = await getPublishedReflections();
  const pages = await getAllPages();
  const themes = await getThemes();
  return {
    reflections: published.map(toReflectionView),
    pages: pages.map((p) => ({ uri: p.uri, content: p.content })),
    themes: themes.map((t) => ({
      id: t.id,
      name: t.name,
      bg: t.bg,
      line: t.line,
      ink: t.ink,
      sort: t.sort
    })),
    generatedAt: now.toISOString()
  };
}
