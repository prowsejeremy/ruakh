import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/index';
import { admins } from '$lib/server/db/schema';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, generateSessionToken, SESSION_COOKIE } from '$lib/server/auth/session';
import { isSameOriginBrowserRequest, clientIp } from '$lib/server/request-guard';
import { createRateLimiter } from '$lib/server/rate-limit';

// A syntactically valid scrypt hash of nothing — verified against when the
// email is unknown, so response timing doesn't reveal which emails exist.
const DUMMY_HASH = 'scrypt:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:' + 'ab'.repeat(64);

// Per-IP brute-force cap, far tighter than the public API fences: 5 attempts
// per 15 minutes (~480/day) makes guessing a scrypt-hashed 12+ char password
// hopeless. Counts every attempt, success included — a real admin never signs
// in 5 times in a quarter hour. Module scope: one limiter per process.
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60_000;
const limiter = createRateLimiter({ limit: LOGIN_LIMIT, windowMs: LOGIN_WINDOW_MS });

export const load: PageServerLoad = ({ locals }) => {
  if (locals.admin) redirect(303, '/admin');
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies, getClientAddress }) => {
    // Same fencing as the public API endpoints, before any parsing or scrypt
    // work. The strict same-origin check refuses curl/scripted POSTs outright
    // (a forged header is possible, so the limiter is the real control).
    if (!isSameOriginBrowserRequest(request)) {
      return fail(403, { error: 'Cross-site or non-browser requests are not accepted.' });
    }
    const { allowed, retryAfterSec } = limiter.check(clientIp(request.headers, getClientAddress()));
    if (!allowed) {
      const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
      return fail(429, { error: `Too many attempts — try again in ${minutes} min.` });
    }

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
