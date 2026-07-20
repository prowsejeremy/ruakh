import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  addFavorite,
  removeFavorite,
  isFavorite,
  listFavorites,
  recordHistory,
  listHistory,
  clearAllData
} from './storage';
// Relative import: vitest has no `$lib` alias configured (daily.test.ts is relative too).
import { parseContent } from '../markdown';
import type { ReflectionView } from '../types';

const reflectionA: ReflectionView = { id: 1, body: [parseContent('a')], attribution: 'A', source: null };
const reflectionB: ReflectionView = { id: 2, body: [parseContent('b')], attribution: null, source: 'B' };

beforeEach(async () => {
  await clearAllData();
});

describe('favorites', () => {
  it('adds, reports and removes a favorite', async () => {
    expect(await isFavorite(1)).toBe(false);
    await addFavorite(reflectionA);
    expect(await isFavorite(1)).toBe(true);
    await removeFavorite(1);
    expect(await isFavorite(1)).toBe(false);
  });

  it('lists favorites newest-first and snapshots reflection content', async () => {
    await addFavorite(reflectionA);
    await addFavorite(reflectionB);
    const list = await listFavorites();
    expect(list.map((f) => f.id)).toEqual([2, 1]);
    expect(list[1]).toMatchObject({ body: [parseContent('a')], attribution: 'A' });
  });

  it('is idempotent for the same reflection id', async () => {
    await addFavorite(reflectionA);
    await addFavorite(reflectionA);
    expect((await listFavorites()).length).toBe(1);
  });
});

// Svelte 5 `$state` wraps objects in deep proxies, and IndexedDB's structured
// clone rejects proxies (DataCloneError) — including ones nested inside an
// otherwise-plain record. Callers hold reflections in reactive state (the
// Actions bar's save button), so the store must snapshot to plain data.
function deepProxy<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  return new Proxy(value as object, {
    get: (target, key) => deepProxy(Reflect.get(target, key))
  }) as T;
}

describe('reactive-proxy inputs (Svelte $state)', () => {
  it('addFavorite stores a deep-proxied reflection as plain data', async () => {
    await addFavorite(deepProxy(reflectionA));
    expect(await isFavorite(1)).toBe(true);
    expect((await listFavorites())[0]).toMatchObject({ body: [parseContent('a')], attribution: 'A' });
  });

  it('recordHistory stores a deep-proxied reflection as plain data', async () => {
    await recordHistory(deepProxy(reflectionB), '2026-07-21');
    expect((await listHistory())[0]).toMatchObject({ id: 2, seenOn: '2026-07-21' });
  });
});

describe('history', () => {
  it('records one entry per UTC day, idempotently', async () => {
    await recordHistory(reflectionA, '2026-07-01');
    await recordHistory(reflectionA, '2026-07-01');
    await recordHistory(reflectionB, '2026-07-02');
    const list = await listHistory();
    expect(list.length).toBe(2);
  });

  it('lists history newest-first with the seen date', async () => {
    await recordHistory(reflectionA, '2026-07-01');
    await recordHistory(reflectionB, '2026-07-02');
    const list = await listHistory();
    expect(list[0]).toMatchObject({ id: 2, seenOn: '2026-07-02' });
    expect(list[1]).toMatchObject({ id: 1, seenOn: '2026-07-01' });
  });
});

describe('clearAllData', () => {
  it('erases both stores', async () => {
    await addFavorite(reflectionA);
    await recordHistory(reflectionB, '2026-07-02');
    await clearAllData();
    expect(await listFavorites()).toEqual([]);
    expect(await listHistory()).toEqual([]);
  });
});
