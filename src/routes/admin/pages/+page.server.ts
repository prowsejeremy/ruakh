import type { PageServerLoad } from './$types';
import { getAllPages } from '$lib/server/db/pages';

export const load: PageServerLoad = async () => {
  return { pages: await getAllPages() };
};
