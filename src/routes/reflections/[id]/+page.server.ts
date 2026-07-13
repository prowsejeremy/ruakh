import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublishedReflectionById, toReflectionView } from '$lib/server/db/reflections';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) error(404, 'Not found');
  const reflection = await getPublishedReflectionById(id);
  if (!reflection) error(404, 'Not found');
  setHeaders({ 'cache-control': 'no-cache' });
  return { reflection: toReflectionView(reflection) };
};
