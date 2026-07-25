import { getPublishedReflections, toReflectionView } from './db/reflections';
import { getAllPages } from './db/pages';
import { getThemes } from './db/themes';
import type { ReflectionView } from '$lib/types';

export type BundleTheme = {
  id: number;
  name: string;
  bg: string;
  accent: string;
  ink: string;
  sort: number;
};

export type BundlePage = {
  uri: string;
  title: string;
  linkLocation: string;
  content: string;
};

export type ContentBundle = {
  reflections: ReflectionView[];
  pages: BundlePage[];
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
 * `pages` feed the preferences screen's menu/footer links offline (their
 * bodies are still carried for future use — the /[uri] shell is served from
 * the SW page cache). `themes` power the preferences theme picker offline and
 * ride the same cache.
 */
export async function buildContentBundle(now: Date): Promise<ContentBundle> {
  const published = await getPublishedReflections();
  const pages = await getAllPages();
  const themes = await getThemes();
  return {
    reflections: published.map(toReflectionView),
    pages: pages.map((p) => ({
      uri: p.uri,
      title: p.title,
      linkLocation: p.linkLocation,
      content: p.content
    })),
    themes: themes.map((t) => ({
      id: t.id,
      name: t.name,
      bg: t.bg,
      accent: t.accent,
      ink: t.ink,
      sort: t.sort
    })),
    generatedAt: now.toISOString()
  };
}
