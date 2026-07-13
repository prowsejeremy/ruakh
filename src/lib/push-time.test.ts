import { describe, it, expect } from 'vitest';
import { toUtcMinute, minuteOfDayUtc } from './push-time';

describe('toUtcMinute', () => {
  it('converts a local HH:MM to a UTC minute using the given offset', () => {
    // UTC+12 (NZST): 07:00 local = 19:00 UTC the previous day = minute 1140
    expect(toUtcMinute('07:00', -720)).toBe(1140);
    // UTC: no shift
    expect(toUtcMinute('07:00', 0)).toBe(420);
    // UTC-5: 07:00 local = 12:00 UTC
    expect(toUtcMinute('07:00', 300)).toBe(720);
  });

  it('wraps around midnight in both directions', () => {
    expect(toUtcMinute('00:15', 300)).toBe(315);
    expect(toUtcMinute('23:45', -720)).toBe(705);
  });
});

describe('minuteOfDayUtc', () => {
  it('returns the UTC minute of day', () => {
    expect(minuteOfDayUtc(new Date('2026-07-03T00:00:00Z'))).toBe(0);
    expect(minuteOfDayUtc(new Date('2026-07-03T07:30:00Z'))).toBe(450);
    expect(minuteOfDayUtc(new Date('2026-07-03T23:59:59Z'))).toBe(1439);
  });
});
