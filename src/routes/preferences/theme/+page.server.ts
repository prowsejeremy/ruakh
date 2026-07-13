import type { PageServerLoad } from './$types';
import { getThemes } from '$lib/server/db/themes';

export const load: PageServerLoad = async ({ setHeaders }) => {
  // Small, admin-editable content: revalidate rather than serve stale.
  setHeaders({ 'cache-control': 'no-cache' });
  return { themes: await getThemes() };
};
