import { describe, it, expect } from 'vitest';
import { dayNumber, selectDailyReflection, utcDateKey } from './daily';

const reflections = [
  { id: 1, body: 'a' },
  { id: 2, body: 'b' },
  { id: 3, body: 'c' }
];

describe('dayNumber', () => {
  it('counts whole UTC days since the epoch', () => {
    expect(dayNumber(new Date('1970-01-01T00:00:00Z'))).toBe(0);
    expect(dayNumber(new Date('1970-01-02T00:00:00Z'))).toBe(1);
    expect(dayNumber(new Date('1970-01-02T23:59:59Z'))).toBe(1);
  });
});

describe('selectDailyReflection', () => {
  it('returns null when there are no reflections', () => {
    expect(selectDailyReflection([], new Date('2026-07-02T00:00:00Z'))).toBeNull();
  });

  it('is deterministic for a given date', () => {
    const date = new Date('2026-07-02T09:30:00Z');
    expect(selectDailyReflection(reflections, date)).toEqual(selectDailyReflection(reflections, date));
  });

  it('is stable across times within the same UTC day', () => {
    const morning = selectDailyReflection(reflections, new Date('2026-07-02T00:00:01Z'));
    const evening = selectDailyReflection(reflections, new Date('2026-07-02T23:59:59Z'));
    expect(morning).toEqual(evening);
  });

  it('rotates through the whole set on consecutive days', () => {
    const seen = new Set<number>();
    for (let i = 0; i < reflections.length; i++) {
      const d = new Date(Date.UTC(2026, 6, 2 + i));
      seen.add(selectDailyReflection(reflections, d)!.id);
    }
    expect(seen.size).toBe(reflections.length);
  });

  it('handles pre-epoch dates without going out of bounds', () => {
    const result = selectDailyReflection(reflections, new Date('1969-12-30T00:00:00Z'));
    expect(result).not.toBeUndefined();
    expect(reflections).toContainEqual(result);
  });
});

describe('utcDateKey', () => {
  it('formats the UTC calendar date as YYYY-MM-DD', () => {
    expect(utcDateKey(new Date('2026-07-02T09:30:00Z'))).toBe('2026-07-02');
  });

  it('uses the UTC day, not local time, at day boundaries', () => {
    expect(utcDateKey(new Date('2026-07-02T23:59:59Z'))).toBe('2026-07-02');
    expect(utcDateKey(new Date('2026-07-03T00:00:01Z'))).toBe('2026-07-03');
  });
});
