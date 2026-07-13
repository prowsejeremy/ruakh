import type { PageServerLoad } from './$types';
import { getPublishedReflections, toReflectionView } from '$lib/server/db/reflections';
import { selectDailyReflection, utcDateKey } from '$lib/daily';
import type { ReflectionView } from '$lib/types';

export const load: PageServerLoad = async () => {
  // One `now` for both selection and the history key, so the client records
  // this reflection under the same UTC day that selected it — even if the page
  // mounts after a UTC midnight boundary (or is served stale by a future SW).
  const now = new Date();
  const today = selectDailyReflection(await getPublishedReflections(), now);
  // Deliberately trimmed to what the screen renders (id included for
  // Plan 3's on-device favorites). Copyright stays server-side for now.
  const reflection: ReflectionView | null = today ? toReflectionView(today) : null;
  return { reflection, dateKey: utcDateKey(now) };
};
