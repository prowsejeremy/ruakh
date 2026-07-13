const MS_PER_DAY = 86_400_000;

/** Whole UTC days since the Unix epoch. Stable for everyone worldwide. */
export function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

/** The UTC calendar date as 'YYYY-MM-DD' — the key for one day's reflection. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Deterministically pick one item for a given calendar date.
 * Same date -> same item for everyone; rotates through the whole set as
 * the day number increments. Items should be passed in a stable order.
 */
export function selectDailyReflection<T>(reflections: readonly T[], date: Date): T | null {
  if (reflections.length === 0) return null;
  const index = ((dayNumber(date) % reflections.length) + reflections.length) % reflections.length;
  return reflections[index];
}
