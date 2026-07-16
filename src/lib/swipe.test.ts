import { describe, it, expect } from 'vitest';
import { swipeStep, SWIPE_THRESHOLD, SWIPE_MAX_MS } from './swipe';

// Convenience: a quick gesture, within the time cap.
const fast = SWIPE_MAX_MS - 1;

describe('swipeStep', () => {
  it('returns 0 below the horizontal threshold', () => {
    expect(swipeStep(SWIPE_THRESHOLD - 1, 0, fast)).toBe(0);
    expect(swipeStep(-(SWIPE_THRESHOLD - 1), 0, fast)).toBe(0);
  });

  it('advances (+1) on a quick leftward swipe past the threshold', () => {
    expect(swipeStep(-(SWIPE_THRESHOLD + 1), 0, fast)).toBe(1);
  });

  it('goes back (-1) on a quick rightward swipe past the threshold', () => {
    expect(swipeStep(SWIPE_THRESHOLD + 1, 0, fast)).toBe(-1);
  });

  it('ignores gestures where vertical movement dominates (native scroll)', () => {
    expect(swipeStep(SWIPE_THRESHOLD + 10, SWIPE_THRESHOLD + 20, fast)).toBe(0);
    expect(swipeStep(-(SWIPE_THRESHOLD + 10), SWIPE_THRESHOLD + 20, fast)).toBe(0);
  });

  it('requires horizontal to strictly exceed vertical', () => {
    expect(swipeStep(SWIPE_THRESHOLD + 5, SWIPE_THRESHOLD + 5, fast)).toBe(0);
  });

  it('ignores gestures slower than the time cap (deliberate drag)', () => {
    expect(swipeStep(SWIPE_THRESHOLD + 50, 0, SWIPE_MAX_MS + 1)).toBe(0);
  });

  it('accepts custom threshold and time cap', () => {
    expect(swipeStep(15, 0, 100, { threshold: 10 })).toBe(-1);
    expect(swipeStep(15, 0, 100, { threshold: 20 })).toBe(0);
    expect(swipeStep(50, 0, 100, { maxMs: 50 })).toBe(0);
  });
});
