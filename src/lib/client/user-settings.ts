// The local "user" object — per-device flags about this visitor, persisted in
// localStorage like the theme snapshot and breathe toggles. Never leaves the
// device; there is no server-side account behind it.

const KEY = "ruakh:user";

export interface UserSettings {
  /** Whether the one-time onboarding (about content shown before the first reflection) was dismissed. */
  onboarded: boolean;
}

const DEFAULTS: UserSettings = { onboarded: false };

/** The saved user object, or defaults (first visit, storage unavailable). */
export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<UserSettings>;
      return {
        onboarded:
          typeof saved.onboarded === "boolean"
            ? saved.onboarded
            : DEFAULTS.onboarded,
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULTS };
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* persistence is a nicety */
  }
}
