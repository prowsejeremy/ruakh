import { openDB, type IDBPDatabase } from 'idb';
import { selectDailyReflection } from '../daily';
import type { ReflectionView } from '../types';
import type { ContentBundle } from '../server/content-bundle';

// Separate DB from user data (storage.ts): this is a disposable public-content
// cache, versioned independently, and safe to clear without touching favorites.
const DB_NAME = 'ruakh-content';
const DB_VERSION = 1;
const STORE = 'bundle';
const KEY = 'current';
const ETAG_KEY = 'etag';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE);
      }
    });
    // Don't cache a rejected open forever (private browsing, quota).
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

export async function saveBundle(bundle: ContentBundle): Promise<void> {
  const db = await getDb();
  await db.put(STORE, bundle, KEY);
}

export async function loadBundle(): Promise<ContentBundle | null> {
  const db = await getDb();
  return ((await db.get(STORE, KEY)) as ContentBundle | undefined) ?? null;
}

/** Today's reflection computed on-device — identical to the server's pick. */
export async function getOfflineDailyReflection(date: Date): Promise<ReflectionView | null> {
  const bundle = await loadBundle();
  if (!bundle) return null;
  return selectDailyReflection(bundle.reflections, date);
}

/** Themes for the preferences theme picker when offline (server SSR is preferred online). */
export async function getCachedThemes(): Promise<ContentBundle['themes']> {
  return (await loadBundle())?.themes ?? [];
}

/**
 * Refresh the cached bundle, conditionally. Sends the stored ETag as
 * If-None-Match; a 304 means content is unchanged and we keep the cache
 * untouched (no re-download, no re-write). Only an actual amendment transfers
 * bytes. Silent no-op offline.
 */
export async function refreshContentBundle(): Promise<void> {
  try {
    const db = await getDb();
    const etag = (await db.get(STORE, ETAG_KEY)) as string | undefined;
    const res = await fetch('/api/content/bundle', {
      headers: etag ? { 'if-none-match': etag } : {}
    });
    if (res.status === 304) return; // unchanged — keep cache
    if (res.ok) {
      await saveBundle((await res.json()) as ContentBundle);
      const newEtag = res.headers.get('etag');
      if (newEtag) await db.put(STORE, newEtag, ETAG_KEY);
    }
  } catch {
    /* offline / transient — keep whatever is cached */
  }
}

export async function clearContent(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE); // clears the bundle AND the stored etag
}
