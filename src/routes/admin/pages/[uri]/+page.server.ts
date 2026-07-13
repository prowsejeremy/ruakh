import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deletePage, getPage, upsertPage } from '$lib/server/db/pages';

const MAX_LENGTH = 10_000;

export const load: PageServerLoad = async ({ params }) => {
  const page = await getPage(params.uri);
  if (!page) error(404, 'Not found');
  return { page };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    // Actions skip the load's 404, and upsert would CREATE — so confirm the
    // page exists first, else a POST to /admin/pages/settings?/update could
    // forge a reserved/invalid uri.
    const existing = await getPage(params.uri);
    if (!existing) error(404, 'Not found');

    const form = await request.formData();
    const content = form.get('content');

    if (typeof content !== 'string' || !content.trim()) {
      return fail(400, { error: 'Content is required.' });
    }
    if (content.length > MAX_LENGTH) {
      return fail(400, { error: 'Content is too long.' });
    }

    await upsertPage(params.uri, content.trim());
    redirect(303, '/admin/pages');
  },

  delete: async ({ params }) => {
    if (params.uri === 'about') {
      return fail(400, { error: 'The about page is linked from the app.' });
    }
    await deletePage(params.uri);
    redirect(303, '/admin/pages');
  }
};
