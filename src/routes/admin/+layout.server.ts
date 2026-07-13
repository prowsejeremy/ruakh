import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/** Everything under /admin requires a session, except the login page itself. */
export const load: LayoutServerLoad = ({ locals, url }) => {
  if (!locals.admin && url.pathname !== '/admin/login') {
    redirect(303, '/admin/login');
  }
  return { admin: locals.admin };
};
