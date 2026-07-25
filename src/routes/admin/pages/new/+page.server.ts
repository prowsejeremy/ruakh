import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getPage, upsertPage } from '$lib/server/db/pages';
import { pageLinkLocationError, pageTitleError, pageUriError } from '$lib/server/validation';
import type { PageLinkLocation } from '$lib/page-links';

const MAX_LENGTH = 10_000;

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const uri = form.get('uri');
    const title = form.get('title');
    const linkLocation = form.get('linkLocation');
    const content = form.get('content');

    const uriError = pageUriError(uri);
    if (uriError) return fail(400, { error: uriError });
    // Narrow for TS — pageUriError already guaranteed a valid string.
    const validUri = uri as string;
    const titleError = pageTitleError(title);
    if (titleError) return fail(400, { error: titleError });
    const locationError = pageLinkLocationError(linkLocation);
    if (locationError) return fail(400, { error: locationError });
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

    await upsertPage(validUri, {
      title: (title as string).trim(),
      linkLocation: linkLocation as PageLinkLocation,
      content: content.trim()
    });
    redirect(303, '/admin/pages');
  }
};
