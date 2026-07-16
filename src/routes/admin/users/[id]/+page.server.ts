import { and, eq, ne } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { admins } from '$lib/server/db/schema';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 12;

/** Parse the route id and reject anyone editing an account other than their own. */
function ownId(params: { id: string }, locals: App.Locals): number {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) error(400, 'Bad request');
  if (id !== locals.admin?.id) error(403, 'Forbidden');
  return id;
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = ownId(params, locals);
  const [admin] = await db
    .select({ id: admins.id, email: admins.email })
    .from(admins)
    .where(eq(admins.id, id));
  if (!admin) error(404, 'Not found');
  return { admin };
};

export const actions: Actions = {
  updateEmail: async ({ request, params, locals }) => {
    const id = ownId(params, locals);
    const form = await request.formData();
    const email = form.get('email');

    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return fail(400, { emailError: 'A valid email is required.' });
    }
    const trimmed = email.trim();

    const [clash] = await db
      .select({ id: admins.id })
      .from(admins)
      .where(and(eq(admins.email, trimmed), ne(admins.id, id)));
    if (clash) {
      return fail(400, { emailError: 'An admin with that email already exists.' });
    }

    await db.update(admins).set({ email: trimmed }).where(eq(admins.id, id));
    return { emailUpdated: true };
  },

  changePassword: async ({ request, params, locals }) => {
    const id = ownId(params, locals);
    const form = await request.formData();
    const current = form.get('current');
    const next = form.get('next');
    const confirm = form.get('confirm');

    if (typeof current !== 'string' || typeof next !== 'string' || typeof confirm !== 'string') {
      return fail(400, { passwordError: 'All password fields are required.' });
    }

    const [admin] = await db
      .select({ passwordHash: admins.passwordHash })
      .from(admins)
      .where(eq(admins.id, id));
    if (!admin || !(await verifyPassword(current, admin.passwordHash))) {
      return fail(400, { passwordError: 'Current password is incorrect.' });
    }
    if (next !== confirm) {
      return fail(400, { passwordError: 'New passwords do not match.' });
    }
    if (next.length < MIN_PASSWORD) {
      return fail(400, { passwordError: `Password must be at least ${MIN_PASSWORD} characters.` });
    }

    const passwordHash = await hashPassword(next);
    await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
    return { passwordChanged: true };
  }
};
