import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createTheme } from '$lib/server/db/themes';
import { isHexColor } from '$lib/server/validation';

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const name = form.get('name');
    const bg = form.get('bg');
    const accent = form.get('accent');
    const ink = form.get('ink');

    if (typeof name !== 'string' || !name.trim()) {
      return fail(400, { error: 'Name is required.' });
    }
    // Hex-validate: these land in style attributes served to visitors; a
    // non-color string (via curl) would be CSS injection.
    if (!isHexColor(bg) || !isHexColor(accent) || !isHexColor(ink)) {
      return fail(400, { error: 'Colors must be 6-digit hex values.' });
    }

    await createTheme({ name: name.trim(), bg, accent, ink });
    redirect(303, '/admin/themes');
  }
};
