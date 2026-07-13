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
