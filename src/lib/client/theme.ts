import { FALLBACK_THEME, type Theme } from '$lib/themes';

const KEY = 'ruakh:theme';

/** Convert a hex color (#rgb or #rrggbb) to an "r, g, b" string for rgba(var(...), a). */
export function hexToRgb(hex: string): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** The saved theme snapshot (colors from localStorage), or the fallback. */
export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Theme>;
      if (saved.id && saved.bg && saved.line && saved.ink) {
        return { id: saved.id, name: saved.name ?? saved.id, bg: saved.bg, line: saved.line, ink: saved.ink };
      }
    }
  } catch {
    /* fall through to fallback */
  }
  return FALLBACK_THEME;
}

/** Apply a theme to the live document (CSS vars + browser chrome color). */
export function applyTheme(theme: Theme): void {
  const s = document.documentElement.style;
  s.setProperty('--color-bg', theme.bg);
  s.setProperty('--color-bg-rgb', hexToRgb(theme.bg));
  s.setProperty('--color-accent', theme.line);
  s.setProperty('--color-accent-rgb', hexToRgb(theme.line));
  s.setProperty('--color-ink', theme.ink);
  s.setProperty('--color-ink-rgb', hexToRgb(theme.ink));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.bg);
}

/** Persist + apply. Snapshot stores colors too so the pre-paint script needs no registry. */
export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ id: theme.id, name: theme.name, bg: theme.bg, line: theme.line, ink: theme.ink })
    );
  } catch {
    /* persistence is a nicety */
  }
  applyTheme(theme);
}
