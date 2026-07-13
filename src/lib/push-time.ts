/**
 * Pure reminder-time math, shared by the preferences client (local → UTC
 * conversion) and the server scheduler. `offsetMinutes` follows
 * Date.prototype.getTimezoneOffset(): minutes to ADD to local time to get
 * UTC (UTC+12 → -720).
 */

/** Convert a local 'HH:MM' to a UTC minute-of-day (0-1439). */
export function toUtcMinute(hhmm: string, offsetMinutes: number): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + m + offsetMinutes + 1440) % 1440;
}

/** The UTC minute of day for a given instant. */
export function minuteOfDayUtc(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}
