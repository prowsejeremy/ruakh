import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { reflections } from '$lib/server/db/schema';

const MAX_LENGTH = 10_000;

function parseId(param: string): number {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) error(404, 'Not found');
  return id;
}

export const load: PageServerLoad = async ({ params }) => {
  const id = parseId(params.id);
  const [reflection] = await db.select().from(reflections).where(eq(reflections.id, id));
  if (!reflection) error(404, 'Not found');
  return { reflection };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const id = parseId(params.id);
    const form = await request.formData();
    const sections = form
      .getAll('sections')
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => v !== '');

    if (sections.length === 0) {
      return fail(400, { error: 'At least one content section is required.' });
    }
    if (sections.join('').length > MAX_LENGTH) {
      return fail(400, { error: 'Content is too long.' });
    }

    const attribution = form.get('attribution');
    const source = form.get('source');
    const copyright = form.get('copyright');

    await db
      .update(reflections)
      .set({
        sections,
        attribution:
          typeof attribution === 'string' && attribution.trim() ? attribution.trim() : null,
        source: typeof source === 'string' && source.trim() ? source.trim() : null,
        copyright: typeof copyright === 'string' && copyright.trim() ? copyright.trim() : null,
        isPublished: form.get('isPublished') === 'on'
      })
      .where(eq(reflections.id, id));

    redirect(303, '/admin/reflections');
  },

  delete: async ({ params }) => {
    const id = parseId(params.id);
    await db.delete(reflections).where(eq(reflections.id, id));
    redirect(303, '/admin/reflections');
  }
};
