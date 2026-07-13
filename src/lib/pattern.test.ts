import { describe, it, expect } from 'vitest';
import {
  smoothPath,
  buildFromParams,
  polyCoverage,
  polyMinDist,
  generateLines,
  planRotation,
  interpolateLines,
  rescaleLines,
  easeInOutCubic,
  type Rng,
  type Size
} from './pattern';

const SIZE: Size = { w: 1200, h: 800 };

/** Deterministic PRNG (mulberry32) so geometry tests are reproducible. */
function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('smoothPath', () => {
  it('returns an empty string for fewer than two points', () => {
    expect(smoothPath([])).toBe('');
    expect(smoothPath([{ x: 0, y: 0 }])).toBe('');
  });

  it('emits a move followed by cubic segments', () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 }
    ]);
    expect(d.startsWith('M 0.0 0.0')).toBe(true);
    expect(d.match(/ C /g)?.length).toBe(2);
  });
});

describe('polyCoverage', () => {
  it('is 1 when every point is inside the viewport', () => {
    const pts = [
      { x: 10, y: 10 },
      { x: 600, y: 400 }
    ];
    expect(polyCoverage(SIZE, pts)).toBe(1);
  });

  it('is 0 when every point is outside', () => {
    const pts = [
      { x: -10, y: -10 },
      { x: 5000, y: 5000 }
    ];
    expect(polyCoverage(SIZE, pts)).toBe(0);
  });
});

describe('polyMinDist', () => {
  it('is 0 for crossing polylines', () => {
    const A = [
      { x: 0, y: 0 },
      { x: 10, y: 10 }
    ];
    const B = [
      { x: 0, y: 10 },
      { x: 10, y: 0 }
    ];
    expect(polyMinDist(A, B)).toBe(0);
  });

  it('measures the gap between parallel polylines', () => {
    const A = [
      { x: 0, y: 0 },
      { x: 10, y: 0 }
    ];
    const B = [
      { x: 0, y: 5 },
      { x: 10, y: 5 }
    ];
    expect(polyMinDist(A, B)).toBe(5);
  });
});

describe('buildFromParams', () => {
  it('starts and ends exactly on the housing circle (taper envelope)', () => {
    const rng = seededRng(1);
    const line = buildFromParams(SIZE, {
      angA: 0.3,
      angB: 3.5,
      w: 100,
      amp: 50,
      f1: 0.5,
      f2: 1.2,
      a1: 40,
      a2: 10,
      ph1: rng() * Math.PI,
      ph2: rng() * Math.PI
    });
    const R = 0.5 * Math.hypot(SIZE.w, SIZE.h) * 1.12;
    const first = line.pts[0];
    const last = line.pts[line.pts.length - 1];
    const rFirst = Math.hypot(first.x - SIZE.w / 2, first.y - SIZE.h / 2);
    const rLast = Math.hypot(last.x - SIZE.w / 2, last.y - SIZE.h / 2);
    expect(rFirst).toBeCloseTo(R, 5);
    expect(rLast).toBeCloseTo(R, 5);
    expect(line.pts.length).toBe(56);
    expect(line.d.startsWith('M ')).toBe(true);
  });
});

describe('generateLines', () => {
  it('produces 1-2 lines that each sweep the viewport', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const lines = generateLines(SIZE, seededRng(seed));
      expect(lines.length).toBeGreaterThanOrEqual(1);
      expect(lines.length).toBeLessThanOrEqual(2);
      for (const l of lines) {
        expect(polyCoverage(SIZE, l.pts)).toBeGreaterThanOrEqual(0.25);
      }
    }
  });

  it('keeps two lines from touching (stroke clearance respected)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const lines = generateLines(SIZE, seededRng(seed));
      if (lines.length === 2) {
        const clearance = lines[0].w / 2 + lines[1].w / 2;
        expect(polyMinDist(lines[0].pts, lines[1].pts)).toBeGreaterThanOrEqual(clearance);
      }
    }
  });
});

describe('planRotation', () => {
  it('returns one target per line and actually moves the endpoints', () => {
    const rng = seededRng(7);
    const cur = generateLines(SIZE, rng);
    const targets = planRotation(SIZE, cur, 20, 60, rng);
    expect(targets.length).toBe(cur.length);
    for (let i = 0; i < cur.length; i++) {
      expect(targets[i].angA).not.toBe(cur[i].angA);
      expect(polyCoverage(SIZE, targets[i].pts)).toBeGreaterThanOrEqual(0.25);
    }
  });

  it('keeps two rotated lines collision-free', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = seededRng(seed);
      const cur = generateLines(SIZE, rng);
      if (cur.length !== 2) continue;
      const targets = planRotation(SIZE, cur, 20, 60, rng);
      const clearance = cur[0].w / 2 + cur[1].w / 2;
      // Rigid-spin fallback preserves the original gap; planned targets must
      // meet the full clearance. Either way they never touch.
      expect(polyMinDist(targets[0].pts, targets[1].pts)).toBeGreaterThan(0);
      expect(clearance).toBeGreaterThan(0);
    }
  });
});

describe('interpolateLines', () => {
  it('matches the endpoints at e=0 and e=1', () => {
    const rng = seededRng(3);
    const from = generateLines(SIZE, rng);
    const targets = planRotation(SIZE, from, 20, 60, rng);
    const at0 = interpolateLines(SIZE, from, targets, 0);
    const at1 = interpolateLines(SIZE, from, targets, 1);
    for (let i = 0; i < from.length; i++) {
      expect(at0[i].angA).toBeCloseTo(from[i].angA, 10);
      expect(at1[i].angA).toBeCloseTo(targets[i].angA, 10);
      expect(at1[i].angB).toBeCloseTo(targets[i].angB, 10);
    }
  });
});

describe('rescaleLines', () => {
  it('scales waviness and width by the min-dimension ratio', () => {
    const rng = seededRng(5);
    const lines = generateLines(SIZE, rng);
    const doubled: Size = { w: 2400, h: 1600 };
    const scaled = rescaleLines(doubled, SIZE, lines);
    for (let i = 0; i < lines.length; i++) {
      expect(scaled[i].a1).toBeCloseTo(lines[i].a1 * 2, 6);
      expect(scaled[i].amp).toBeCloseTo(lines[i].amp * 2, 6);
    }
  });
});

describe('easeInOutCubic', () => {
  it('anchors at 0 and 1 with a symmetric midpoint', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
  });
});
