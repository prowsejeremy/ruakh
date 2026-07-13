import { asc, eq } from 'drizzle-orm';
import { db } from './index';
import { pages, type Page } from './schema';

/** A single public page by uri, or undefined if it doesn't exist. */
export async function getPage(uri: string): Promise<Page | undefined> {
  const [row] = await db.select().from(pages).where(eq(pages.uri, uri));
  return row;
}

/** All pages, ordered by uri. */
export async function getAllPages(): Promise<Page[]> {
  return db.select().from(pages).orderBy(asc(pages.uri));
}

/** Create or replace a page's content by uri. */
export async function upsertPage(uri: string, content: string): Promise<void> {
  await db
    .insert(pages)
    .values({ uri, content })
    // $onUpdate only fires on db.update(), not on a conflict set — bump explicitly.
    .onConflictDoUpdate({ target: pages.uri, set: { content, updatedAt: new Date() } });
}

export async function deletePage(uri: string): Promise<void> {
  await db.delete(pages).where(eq(pages.uri, uri));
}
