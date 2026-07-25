import type { PageServerLoad } from './$types';
import { getAllPages } from '$lib/server/db/pages';
import { groupPageLinks } from '$lib/page-links';

export const load: PageServerLoad = async ({ setHeaders }) => {
  // Small, admin-editable content: revalidate rather than serve stale.
  setHeaders({ 'cache-control': 'no-cache' });
  return { pageLinks: groupPageLinks(await getAllPages()) };
};
