import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { admins } from '$lib/server/db/schema';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, generateSessionToken, SESSION_COOKIE } from '$lib/server/auth/session';

// A syntactically valid scrypt hash of nothing — verified against when the
// email is unknown, so response timing doesn't reveal which emails exist.
const DUMMY_HASH = 'scrypt:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:' + 'ab'.repeat(64);

export const load: PageServerLoad = ({ locals }) => {
  if (locals.admin) redirect(303, '/admin');
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = form.get('email');
    const password = form.get('password');
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return fail(400, { error: 'Email and password are required.' });
    }

    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    const ok = admin
      ? await verifyPassword(password, admin.passwordHash)
      : ((await verifyPassword(password, DUMMY_HASH)), false);

    if (!ok || !admin) {
      await new Promise((r) => setTimeout(r, 400)); // slow brute force a little
      return fail(400, { error: 'Invalid email or password.' });
    }

    const token = generateSessionToken();
    const session = await createSession(token, admin.id);
    cookies.set(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: !dev,
      expires: session.expiresAt
    });
    redirect(303, '/admin');
  }
};
