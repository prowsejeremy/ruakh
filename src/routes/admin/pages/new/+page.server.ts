import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getPage, upsertPage } from '$lib/server/db/pages';
import { pageUriError } from '$lib/server/validation';

const MAX_LENGTH = 10_000;

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const uri = form.get('uri');
    const content = form.get('content');

    const uriError = pageUriError(uri);
    if (uriError) return fail(400, { error: uriError });
    // Narrow for TS — pageUriError already guaranteed a valid string.
    const validUri = uri as string;
    if (typeof content !== 'string' || !content.trim()) {
      return fail(400, { error: 'Content is required.' });
    }
    if (content.length > MAX_LENGTH) {
      return fail(400, { error: 'Content is too long.' });
    }

    const existing = await getPage(validUri);
    if (existing) {
      return fail(400, { error: 'That uri is taken.' });
    }

    await upsertPage(validUri, content.trim());
    redirect(303, '/admin/pages');
  }
};
