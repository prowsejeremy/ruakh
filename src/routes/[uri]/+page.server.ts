import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPage } from '$lib/server/db/pages';
import { parseContent } from '$lib/markdown';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const page = await getPage(params.uri);
  if (!page) error(404, 'Not found');
  setHeaders({ 'cache-control': 'no-cache' });
  return { uri: page.uri, blocks: parseContent(page.content) };
};
