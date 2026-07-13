/** "Attribution; Source" per the design mock; either part may be absent or empty. */
export function formatAttribution(
  attribution: string | null,
  source: string | null
): string | null {
  if (attribution && source) return `${attribution}; ${source}`;
  return attribution || source || null;
}
