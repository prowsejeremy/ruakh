// Relative (not `$lib`) imports so this module resolves under vitest,
// which has no SvelteKit aliases — same convention as client/storage.ts.
import { utcDateKey } from '../../daily';
import { minuteOfDayUtc } from '../../push-time';

type DueCheck = { reminderMinute: number; lastSentOn: string | null };

/**
 * A subscription is due when its reminder minute has passed today (UTC) and
 * it hasn't been sent today. Late catch-up is intentional: if the server was
 * down at 07:00, the 5-minute tick at 09:00 still delivers today's reminder.
 */
export function dueForSend(sub: DueCheck, now: Date): boolean {
  if (sub.lastSentOn === utcDateKey(now)) return false;
  return minuteOfDayUtc(now) >= sub.reminderMinute;
}
