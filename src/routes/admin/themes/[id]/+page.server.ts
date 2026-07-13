import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { themes } from '$lib/server/db/schema';
import { deleteTheme, updateTheme } from '$lib/server/db/themes';
import { isHexColor } from '$lib/server/validation';

function parseId(param: string): number {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) error(404, 'Not found');
  return id;
}

export const load: PageServerLoad = async ({ params }) => {
  const id = parseId(params.id);
  const [theme] = await db.select().from(themes).where(eq(themes.id, id));
  if (!theme) error(404, 'Not found');
  return { theme };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const id = parseId(params.id);
    const form = await request.formData();
    const name = form.get('name');
    const bg = form.get('bg');
    const line = form.get('line');
    const ink = form.get('ink');

    if (typeof name !== 'string' || !name.trim()) {
      return fail(400, { error: 'Name is required.' });
    }
    if (!isHexColor(bg) || !isHexColor(line) || !isHexColor(ink)) {
      return fail(400, { error: 'Colors must be 6-digit hex values.' });
    }

    await updateTheme(id, { name: name.trim(), bg, line, ink });
    redirect(303, '/admin/themes');
  },

  delete: async ({ params }) => {
    const id = parseId(params.id);
    await deleteTheme(id);
    redirect(303, '/admin/themes');
  }
};
