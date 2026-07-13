import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { subscriptionCount } from '$lib/server/push/subscriptions';
import { invalidateSession, SESSION_COOKIE } from '$lib/server/auth/session';

export const load: PageServerLoad = async () => {
  return {
    // Aggregate ONLY — the admin area never sees subscription rows.
    subscriberCount: await subscriptionCount()
  };
};

export const actions: Actions = {
  logout: async ({ cookies }) => {
    const token = cookies.get(SESSION_COOKIE);
    if (token) await invalidateSession(token);
    cookies.delete(SESSION_COOKIE, { path: '/' });
    redirect(303, '/admin/login');
  }
};
