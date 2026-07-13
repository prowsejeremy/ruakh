import type { PageServerLoad } from './$types';
import { getThemes } from '$lib/server/db/themes';

export const load: PageServerLoad = async () => {
  return { themes: await getThemes() };
};
