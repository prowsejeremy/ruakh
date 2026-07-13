import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db/index';
import { reflections } from '$lib/server/db/schema';

const MAX_LENGTH = 10_000;

export const actions: Actions = {
  create: async ({ request }) => {
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

    await db.insert(reflections).values({
      sections,
      attribution: typeof attribution === 'string' && attribution.trim() ? attribution.trim() : null,
      source: typeof source === 'string' && source.trim() ? source.trim() : null,
      copyright: typeof copyright === 'string' && copyright.trim() ? copyright.trim() : null,
      isPublished: form.get('isPublished') === 'on'
    });

    redirect(303, '/admin/reflections');
  }
};
