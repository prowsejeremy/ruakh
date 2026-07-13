import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { reflections } from '$lib/server/db/schema';
import { parseContent } from '$lib/markdown';

export const load: PageServerLoad = async () => {
  const rows = await db.select().from(reflections).orderBy(desc(reflections.createdAt), desc(reflections.id));
  // Same markdown-lite parse as public routes, so list previews/search see the
  // content the way the app renders it (headings stripped of `#` markers etc.).
  return { reflections: rows.map((q) => ({ ...q, sections: q.sections.map(parseContent) })) };
};
