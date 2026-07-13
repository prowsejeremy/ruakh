import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db/index';
import { admins } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const email = form.get('email');

    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return fail(400, { error: 'A valid email is required.' });
    }
    const trimmed = email.trim();

    // Don't silently reset an existing admin's password — creating is create-only.
    const [existing] = await db.select().from(admins).where(eq(admins.email, trimmed));
    if (existing) {
      return fail(400, { error: 'An admin with that email already exists.' });
    }

    const password = randomBytes(12).toString('base64url');
    const passwordHash = await hashPassword(password);
    await db.insert(admins).values({ email: trimmed, passwordHash });

    return { email: trimmed, password };
  }
};
