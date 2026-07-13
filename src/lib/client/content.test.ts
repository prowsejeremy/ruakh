import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { saveBundle, loadBundle, getOfflineDailyReflection, clearContent } from './content';
import { parseContent } from '../markdown';
import type { ContentBundle } from '../server/content-bundle';

/** Body parts the way toReflectionView produces them: parsed markdown-lite blocks. */
const body = (...parts: string[]) => parts.map(parseContent);

const bundle: ContentBundle = {
  reflections: [
    { id: 1, body: body('a'), attribution: null, source: null },
    { id: 2, body: body('b'), attribution: null, source: null },
    { id: 3, body: body('c'), attribution: null, source: null }
  ],
  pages: [],
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
});
