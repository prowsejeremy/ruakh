// Persisted music / voice-guide toggles for the /breathe screen. Device-local
// (localStorage), like the theme snapshot — never leaves the device.

const KEY = 'ruakh:breathe-audio';

export interface BreatheSettings {
  music: boolean;
  guide: boolean;
}

const DEFAULTS: BreatheSettings = { music: true, guide: true };

/** The saved toggles, or both-on defaults (first visit, storage unavailable). */
export function loadBreatheSettings(): BreatheSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<BreatheSettings>;
      return {
        music: typeof saved.music === 'boolean' ? saved.music : DEFAULTS.music,
        guide: typeof saved.guide === 'boolean' ? saved.guide : DEFAULTS.guide
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULTS };
}

export function saveBreatheSettings(settings: BreatheSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* persistence is a nicety */
  }
}
