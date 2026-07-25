import { loadUserSettings } from "./user-settings";

// First-load experience flags shared between the home page and the root layout.
//
// `done` — whether the once-per-full-page-load intro has finished. The home
// page plays the intro and flips this; the layout holds the header wordmark
// back until the intro wordmark can morph into it. Only ever mutated in the
// browser, so SSR of `/` always renders intro-first — same behavior as the
// module-level `introPlayed` this replaces.
//
// `onboarded` — whether the one-time onboarding (the about content shown
// before the first reflection) was dismissed. Seeded from the persisted
// `ruakh:user` object at module eval: false during SSR (no localStorage —
// harmless, SSR renders intro-first anyway), the real value in the browser.
// Dismissing sets this AND persists via saveUserSettings.
export const intro = $state({
  done: false,
  onboarded: loadUserSettings().onboarded,
});
