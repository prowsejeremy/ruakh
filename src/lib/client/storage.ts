import { openDB, type IDBPDatabase } from 'idb';
// Relative (not `$lib`) so the module resolves under vitest, which has no SvelteKit aliases.
import type { ReflectionView } from '../types';

/**
 * On-device storage — the privacy boundary of the app.
 * Everything here stays in the browser's IndexedDB; nothing is ever sent
 * to the server. Records snapshot full reflection content so lists render
 * offline and survive content changes upstream.
 */

export type FavoriteRecord = ReflectionView & { favoritedAt: string };
export type HistoryRecord = ReflectionView & { seenOn: string };

const DB_NAME = 'ruakh';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

// `Date.toISOString()` has only millisecond resolution, so two favorites
// added in quick succession (as happens in tests, and can happen with fast
// user taps) can tie on `favoritedAt`, making "newest-first" order
// nondeterministic. Track the last-issued timestamp and bump by 1ms on a
// collision so ordering stays strictly increasing with insertion order.
let lastFavoritedAt = 0;

function nextFavoritedAt(): string {
  const now = Date.now();
  lastFavoritedAt = now > lastFavoritedAt ? now : lastFavoritedAt + 1;
  return new Date(lastFavoritedAt).toISOString();
}

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('favorites', { keyPath: 'id' });
        db.createObjectStore('history', { keyPath: 'seenOn' });
      }
    });
    // Don't cache a rejection forever (storage denied, private browsing,
    // quota): clear the cache so a later call can retry.
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

export async function addFavorite(reflection: ReflectionView): Promise<void> {
  const db = await getDb();
  const record: FavoriteRecord = { ...reflection, favoritedAt: nextFavoritedAt() };
  await db.put('favorites', record);
}

export async function removeFavorite(id: number): Promise<void> {
  const db = await getDb();
  await db.delete('favorites', id);
}

export async function isFavorite(id: number): Promise<boolean> {
  const db = await getDb();
  return (await db.getKey('favorites', id)) !== undefined;
}

export async function listFavorites(): Promise<FavoriteRecord[]> {
  const db = await getDb();
  const all = (await db.getAll('favorites')) as FavoriteRecord[];
  return all.sort((a, b) => b.favoritedAt.localeCompare(a.favoritedAt));
}

/** Record the reflection seen on a given UTC day. Re-recording the same day is a no-op overwrite. */
export async function recordHistory(reflection: ReflectionView, seenOn: string): Promise<void> {
  const db = await getDb();
  const record: HistoryRecord = { ...reflection, seenOn };
  await db.put('history', record);
}

export async function listHistory(): Promise<HistoryRecord[]> {
  const db = await getDb();
  const all = (await db.getAll('history')) as HistoryRecord[];
  return all.sort((a, b) => b.seenOn.localeCompare(a.seenOn));
}

/** Erase everything this app has stored on the device — atomically. */
export async function clearAllData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['favorites', 'history'], 'readwrite');
  await Promise.all([
    tx.objectStore('favorites').clear(),
    tx.objectStore('history').clear(),
    tx.done
  ]);
}
