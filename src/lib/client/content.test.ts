import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveBundle,
  loadBundle,
  getOfflineDailyReflection,
  getCachedPageLinks,
  clearContent
} from './content';
import { parseContent } from '../markdown';
import type { ContentBundle } from '../server/content-bundle';

/** Body parts the way toReflectionView produces them: parsed markdown-lite blocks. */
const body = (...parts: string[]) => parts.map(parseContent);

const bundle: ContentBundle = {
  reflections: [
    { id: 1, body: body('a'), attribution: null, source: null, copyright: null },
    { id: 2, body: body('b'), attribution: null, source: null, copyright: null },
    { id: 3, body: body('c'), attribution: null, source: null, copyright: null }
  ],
  pages: [
    { uri: 'about', title: 'About', linkLocation: 'menu', content: '# hi' },
    { uri: 'privacy-policy', title: 'Privacy policy', linkLocation: 'footer', content: 'p' },
    { uri: 'hidden', title: 'Hidden', linkLocation: 'none', content: 'h' }
  ],
  themes: [],
  generatedAt: '2026-07-03T00:00:00Z'
};

beforeEach(async () => {
  await clearContent();
});

describe('content cache', () => {
  it('round-trips the bundle', async () => {
    await saveBundle(bundle);
    expect((await loadBundle())?.reflections.length).toBe(3);
  });

  it('computes the offline daily reflection from the cached set', async () => {
    await saveBundle(bundle);
    const q = await getOfflineDailyReflection(new Date('2026-07-03T08:00:00Z'));
    expect(q).not.toBeNull();
    expect(bundle.reflections.map((x) => x.id)).toContain(q!.id);
  });

  it('is deterministic and stable within a UTC day', async () => {
    await saveBundle(bundle);
    const a = await getOfflineDailyReflection(new Date('2026-07-03T00:01:00Z'));
    const b = await getOfflineDailyReflection(new Date('2026-07-03T23:59:00Z'));
    expect(a!.id).toBe(b!.id);
  });

  it('returns null with no bundle', async () => {
    expect(await getOfflineDailyReflection(new Date())).toBeNull();
  });

  it('groups cached page links for the preferences screen', async () => {
    await saveBundle(bundle);
    expect(await getCachedPageLinks()).toEqual({
      menu: [{ uri: 'about', title: 'About' }],
      footer: [{ uri: 'privacy-policy', title: 'Privacy policy' }]
    });
  });

  it('returns empty link groups with no bundle', async () => {
    expect(await getCachedPageLinks()).toEqual({ menu: [], footer: [] });
  });
});
