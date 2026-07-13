import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { admins } from '$lib/server/db/schema';
import { invalidateSession, SESSION_COOKIE } from '$lib/server/auth/session';

export const load: PageServerLoad = async () => {
  const rows = await db.select().from(admins).orderBy(asc(admins.createdAt), asc(admins.id));
  return { admins: rows };
};

export const actions: Actions = {
  delete: async ({ request, locals, cookies }) => {
    const form = await request.formData();
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) error(400, 'Bad request');

    // Atomic last-admin guard: only delete when more than one admin exists,
    // so two concurrent deletes can't empty the table.
    const deleted = await db
      .delete(admins)
      .where(and(eq(admins.id, id), sql`(select count(*) from ${admins}) > 1`))
      .returning({ id: admins.id });
    if (deleted.length === 0) {
      return fail(400, { error: 'Cannot remove the last admin.' });
    }

    if (locals.admin?.id === id) {
      const token = cookies.get(SESSION_COOKIE);
      if (token) await invalidateSession(token);
      cookies.delete(SESSION_COOKIE, { path: '/' });
      redirect(303, '/admin/login');
    }
  }
};
