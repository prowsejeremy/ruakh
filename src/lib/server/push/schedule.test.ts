import { describe, it, expect } from 'vitest';
import { dueForSend } from './schedule';

const at = (iso: string) => new Date(iso);

describe('dueForSend', () => {
  const sub = { reminderMinute: 420, lastSentOn: null as string | null }; // 07:00 UTC

  it('is due once the reminder minute has passed and nothing was sent today', () => {
    expect(dueForSend(sub, at('2026-07-03T07:00:30Z'))).toBe(true);
    expect(dueForSend(sub, at('2026-07-03T09:00:00Z'))).toBe(true);
  });

  it('is not due before the reminder minute', () => {
    expect(dueForSend(sub, at('2026-07-03T06:59:00Z'))).toBe(false);
  });

  it('is not due twice on the same UTC day', () => {
    expect(dueForSend({ ...sub, lastSentOn: '2026-07-03' }, at('2026-07-03T09:00:00Z'))).toBe(
      false
    );
  });

  it('becomes due again the next day', () => {
    expect(dueForSend({ ...sub, lastSentOn: '2026-07-03' }, at('2026-07-04T07:05:00Z'))).toBe(
      true
    );
  });
});
