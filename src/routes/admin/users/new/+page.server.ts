import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db/index';
import { admins } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 12;

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const email = form.get('email');
    const password = form.get('password');
    const generated = form.get('generated') === '1';

    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return fail(400, { error: 'A valid email is required.' });
    }
    const trimmed = email.trim();

    if (typeof password !== 'string' || password.length === 0) {
      return fail(400, { error: 'A password is required.', email: trimmed });
    }
    if (password.length < MIN_PASSWORD) {
      return fail(400, {
        error: `Password must be at least ${MIN_PASSWORD} characters.`,
        email: trimmed
      });
    }

    // Don't silently reset an existing admin's password — creating is create-only.
    const [existing] = await db.select().from(admins).where(eq(admins.email, trimmed));
    if (existing) {
      return fail(400, { error: 'An admin with that email already exists.', email: trimmed });
    }

    const passwordHash = await hashPassword(password);
    await db.insert(admins).values({ email: trimmed, passwordHash });

    // Only reveal a generated password — a typed one is already known to the operator.
    return { created: true, email: trimmed, generatedPassword: generated ? password : null };
  }
};
