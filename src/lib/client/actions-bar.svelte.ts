import type { ReflectionView } from '../types';

// Shared state for the global Actions bar, mirroring background.svelte.ts for
// the pattern lines. Any page can hide the bar by setting
// `actionsBar.visible = false` (e.g. the breathing exercise hides it for the
// exercise itself); the (app) layout removes the bar while it's false.
// `reflection` enables the bar's save button: the screen currently showing a
// reflection publishes it here (not the route's load data — the home page can
// override a stale SSR pick client-side) and the layout passes it to Actions.
// Transient/in-memory only — restore `visible` to `true` and `reflection` to
// `null` when your screen unmounts so the bar resets elsewhere. Only ever
// mutated in the browser, so SSR always renders the bar (without the save
// button).
export const actionsBar = $state<{ visible: boolean; reflection: ReflectionView | null }>({
  visible: true,
  reflection: null,
});
