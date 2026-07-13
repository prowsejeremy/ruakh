/** Shared admin-input validators, so create/update paths can't drift apart. */

const SLUG_RE = /^[a-z0-9-]+$/;
// Reserved so a page can never shadow a real route or the static /admin/pages/new
// form. `settings`/`archive` stay reserved even though those routes are gone:
// old bookmarks still point there, and a public page appearing at /settings
// would masquerade as the app's own UI.
const RESERVED_URIS = new Set(['admin', 'api', 'archive', 'settings', 'new', 'preferences']);
const HEX_RE = /^#[0-9a-f]{6}$/i;

/** Returns an error message if the page uri is invalid, else null. */
export function pageUriError(uri: unknown): string | null {
  if (typeof uri !== 'string' || !SLUG_RE.test(uri)) {
    return 'Uri must be lowercase letters, numbers and hyphens only.';
  }
  if (RESERVED_URIS.has(uri)) return 'That uri is reserved.';
  return null;
}

/** A 6-digit hex color (#rrggbb). Color inputs are trivially bypassed via curl,
 * and these values are interpolated into style attributes served to visitors. */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value);
}
