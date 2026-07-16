export type Theme = {
  id: string;
  name: string;
  bg: string; // --color-bg
  line: string; // --color-accent
  ink: string; // --color-ink
};

/** Used before the DB-backed picker loads, or if localStorage has nothing saved. */
export const FALLBACK_THEME: Theme = {
  id: 'sunset',
  name: 'Sunset',
  bg: '#f7a31a',
  line: '#f5350b',
  ink: '#000000'
};

/** Fixed dark palette for the admin area. Applied to the *base* theme (document
    root) by the root layout while an /admin route is active — not scoped to a
    wrapper — so the whole chrome (body, wordmark header) follows it. `line` is
    unused (the PatternBackground isn't rendered on admin) so it matches `bg`.
    ⚠️ These hex values are mirrored in src/app.html's pre-paint script (which
    can't import) to keep admin flash-free on a hard load — keep them in sync. */
export const ADMIN_THEME: Theme = {
  id: 'admin',
  name: 'Admin',
  bg: '#111111',
  line: '#111111',
  ink: '#f9f8f6'
};
