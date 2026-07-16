import { describe, it, expect } from 'vitest';
import { placeCircles } from './circle-pattern';

// Deterministic LCG so a "given rng" produces a fixed layout in tests.
const lcg = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

// A circle spills when its bounding box crosses any viewport edge.
const spills = (c: { cx: number; cy: number; size: number }, vp: { w: number; h: number }) => {
  const r = c.size / 2;
  return c.cx - r < 0 || c.cx + r > vp.w || c.cy - r < 0 || c.cy + r > vp.h;
};

const REALISTIC = [
  { w: 320, h: 568 },
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1280, h: 800 },
  { w: 1920, h: 1080 }
];

describe('placeCircles', () => {
  it('returns the requested number of circles (default 2)', () => {
    expect(placeCircles({ w: 1280, h: 800 }, { rng: lcg(1) })).toHaveLength(2);
    expect(placeCircles({ w: 1280, h: 800 }, { count: 2, rng: lcg(1) })).toHaveLength(2);
  });

  it('gives each circle a size within the range and a rotation in [0,360)', () => {
    for (const c of placeCircles({ w: 1280, h: 800 }, { minSize: 800, maxSize: 1500, rng: lcg(2) })) {
      expect(c.size).toBeGreaterThanOrEqual(800);
      expect(c.size).toBeLessThanOrEqual(1500);
      expect(c.rotation).toBeGreaterThanOrEqual(0);
      expect(c.rotation).toBeLessThan(360);
    }
  });

  it('fluctuates the circle sizes across the range, not one fixed size', () => {
    const sizes = new Set<number>();
    for (let s = 1; s <= 60; s++) {
      for (const c of placeCircles({ w: 1280, h: 800 }, { minSize: 800, maxSize: 1500, rng: lcg(s) })) {
        sizes.add(Math.round(c.size));
      }
    }
    // Many distinct sizes, and the spread actually approaches both ends.
    expect(sizes.size).toBeGreaterThan(10);
    expect(Math.min(...sizes)).toBeLessThan(950);
    expect(Math.max(...sizes)).toBeGreaterThan(1350);
  });

  it('always places every circle spilling past a viewport edge', () => {
    for (const vp of REALISTIC) {
      for (let s = 1; s <= 40; s++) {
        for (const c of placeCircles(vp, { minSize: 800, maxSize: 1500, rng: lcg(s * 31 + vp.w) })) {
          expect(spills(c, vp)).toBe(true);
        }
      }
    }
  });

  it('keeps the two circles at least the required separation (overlap 0 = bounding circles just touch)', () => {
    for (const vp of REALISTIC) {
      for (let s = 1; s <= 60; s++) {
        const [a, b] = placeCircles(vp, { minSize: 800, maxSize: 1500, overlap: 0, gap: 0, rng: lcg(s * 17 + vp.h) });
        expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeGreaterThanOrEqual(a.size / 2 + b.size / 2 - 1e-6);
      }
    }
  });

  it('draws the circles closer than bounding-touch when overlap > 0, without breaching the reduced minimum', () => {
    const overlap = 0.35;
    let sawCloserThanTouch = false;
    for (const vp of REALISTIC) {
      for (let s = 1; s <= 60; s++) {
        const [a, b] = placeCircles(vp, { minSize: 800, maxSize: 1500, overlap, gap: 0, rng: lcg(s * 23 + vp.w) });
        const dist = Math.hypot(a.cx - b.cx, a.cy - b.cy);
        const touch = a.size / 2 + b.size / 2;
        // never breach the reduced requirement…
        expect(dist).toBeGreaterThanOrEqual(touch * (1 - overlap) - 1e-6);
        // …and the allowance is actually exercised somewhere
        if (dist < touch - 1e-6) sawCloserThanTouch = true;
      }
    }
    expect(sawCloserThanTouch).toBe(true);
  });

  it('honors a positive gap on top of the overlap allowance', () => {
    const overlap = 0.35;
    for (let s = 1; s <= 30; s++) {
      const [a, b] = placeCircles({ w: 1600, h: 1000 }, { minSize: 800, maxSize: 1500, overlap, gap: 120, rng: lcg(s) });
      const required = (a.size / 2 + b.size / 2) * (1 - overlap) + 120;
      expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeGreaterThanOrEqual(required - 1e-6);
    }
  });

  it('is deterministic for a given rng', () => {
    const a = placeCircles({ w: 1280, h: 800 }, { rng: lcg(42) });
    const b = placeCircles({ w: 1280, h: 800 }, { rng: lcg(42) });
    expect(a).toEqual(b);
  });
});
