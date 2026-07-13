import { and, asc, eq } from 'drizzle-orm';
import { db } from './index';
import { reflections, type Reflection } from './schema';
import { parseContent } from '$lib/markdown';
import type { ReflectionView } from '$lib/types';

/** All published reflections in a stable order (oldest first). */
export async function getPublishedReflections(): Promise<Reflection[]> {
  return db
    .select()
    .from(reflections)
    .where(eq(reflections.isPublished, true))
    .orderBy(asc(reflections.createdAt), asc(reflections.id));
}

/** A single published reflection, or null. Published-only so the public
 * /reflections/[id] route can't enumerate drafts via sequential ids. */
export async function getPublishedReflectionById(id: number): Promise<Reflection | null> {
  const [reflection] = await db
    .select()
    .from(reflections)
    .where(and(eq(reflections.id, id), eq(reflections.isPublished, true)));
  return reflection ?? null;
}

/** Public shape: each section becomes one body part (slider slide), parsed with
 * the same markdown-lite as pages so paragraphs render as individual <p> tags. */
export function toReflectionView(q: Reflection): ReflectionView {
  return {
    id: q.id,
    body: q.sections.map(parseContent),
    attribution: q.attribution,
    source: q.source
  };
}
