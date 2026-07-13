/**
 * Procedural pattern-line geometry for PatternBackground.svelte.
 *
 * Pure and framework-free so it can be unit-tested: all viewport dependence
 * comes through an explicit `Size`, and all randomness through an injectable
 * `Rng` (defaults to Math.random). The model: a housing circle centered on the
 * viewport with radius > half-diagonal, so every endpoint angle lies
 * off-screen; a line is a chord between two angles, decorated with a
 * perpendicular two-sine wave tapered to zero at both ends.
 */

export type Point = { x: number; y: number };
export type Size = { w: number; h: number };
export type Rng = () => number;

export type LineParams = {
  angA: number; // endpoint angles on the housing circle (radians)
  angB: number;
  w: number; // stroke width (px)
  amp: number; // base waviness amplitude (px)
  f1: number; // primary / secondary sine frequency…
  f2: number;
  a1: number; // …and amplitudes
  a2: number;
  ph1: number; // phases
  ph2: number;
};

export type PatternLine = LineParams & { d: string; pts: Point[] };

const rand = (rng: Rng, a: number, b: number) => a + rng() * (b - a);

// --- segment / polyline math -----------------------------------------------

function ptSegDist(p: Point, a: Point, b: Point): number {
  const vx = b.x - a.x,
    vy = b.y - a.y,
    wx = p.x - a.x,
    wy = p.y - a.y;
  const len2 = vx * vx + vy * vy || 1e-9;
  let t = (wx * vx + wy * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(a.x + t * vx - p.x, a.y + t * vy - p.y);
}

function segsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const o = (a: Point, b: Point, c: Point) =>
    Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  return o(p3, p4, p1) !== o(p3, p4, p2) && o(p1, p2, p3) !== o(p1, p2, p4);
}

function segSegDist(a: Point, b: Point, c: Point, d: Point): number {
  if (segsIntersect(a, b, c, d)) return 0;
  return Math.min(ptSegDist(a, c, d), ptSegDist(b, c, d), ptSegDist(c, a, b), ptSegDist(d, a, b));
}

/** Minimum distance between two polylines (0 if they cross). */
export function polyMinDist(A: Point[], B: Point[]): number {
  let min = Infinity;
  for (let i = 0; i < A.length - 1; i++)
    for (let j = 0; j < B.length - 1; j++) {
      const dd = segSegDist(A[i], A[i + 1], B[j], B[j + 1]);
      if (dd < min) min = dd;
    }
  return min;
}

/** Fraction of a polyline's points that fall inside the viewport. */
export function polyCoverage(size: Size, pts: Point[]): number {
  let inside = 0;
  for (const p of pts) if (p.x >= 0 && p.x <= size.w && p.y >= 0 && p.y <= size.h) inside++;
  return inside / pts.length;
}

/** Catmull-Rom-style smooth cubic path through the given points. */
export function smoothPath(pts: Point[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6,
      c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6,
      c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// --- circle model ------------------------------------------------------------

// Radius > half-diagonal so the whole viewport sits inside the circle and
// every point on it is off-screen.
const geom = (size: Size) => ({
  cx: size.w / 2,
  cy: size.h / 2,
  R: 0.5 * Math.hypot(size.w, size.h) * 1.12
});

const onCircle = (g: { cx: number; cy: number; R: number }, ang: number): Point => ({
  x: g.cx + g.R * Math.cos(ang),
  y: g.cy + g.R * Math.sin(ang)
});

function shapeParams(size: Size, rng: Rng) {
  const amp = Math.min(size.w, size.h) * rand(rng, 0.04, 0.14);
  return {
    amp,
    f1: rand(rng, 0.4, 0.9),
    f2: rand(rng, 1.0, 1.8),
    a1: amp * rand(rng, 0.5, 1.0),
    a2: amp * rand(rng, 0.0, 0.4),
    ph1: rand(rng, 0, Math.PI * 2),
    ph2: rand(rng, 0, Math.PI * 2)
  };
}

/**
 * Build the drawable curve for a param set. The perpendicular sine offset is
 * tapered to 0 at both ends so the curve starts/ends exactly on its two
 * circle points.
 */
export function buildFromParams(size: Size, p: LineParams): PatternLine {
  const g = geom(size);
  const A = onCircle(g, p.angA),
    B = onCircle(g, p.angB);
  const dx = B.x - A.x,
    dy = B.y - A.y,
    len = Math.hypot(dx, dy) || 1;
  const ux = dx / len,
    uy = dy / len,
    px = -uy,
    py = ux;
  const n = 56;
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1),
      env = Math.sin(Math.PI * t);
    const off =
      env *
      (p.a1 * Math.sin(2 * Math.PI * p.f1 * t + p.ph1) +
        p.a2 * Math.sin(2 * Math.PI * p.f2 * t + p.ph2));
    pts.push({ x: A.x + ux * len * t + px * off, y: A.y + uy * len * t + py * off });
  }
  return { ...p, d: smoothPath(pts), pts, w: Math.round(p.w) };
}

// A valid line: two angles far enough apart that the chord sweeps across the
// viewport (near-opposite points pass through the center).
function makeLine(size: Size, w: number, rng: Rng): PatternLine | null {
  for (let tries = 0; tries < 60; tries++) {
    const angA = rand(rng, 0, Math.PI * 2);
    const angB = angA + rand(rng, Math.PI * 0.66, Math.PI * 1.34);
    const line = buildFromParams(size, { angA, angB, w, ...shapeParams(size, rng) });
    if (polyCoverage(size, line.pts) >= 0.25) return line;
  }
  return null;
}

const clearanceFor = (size: Size, w1: number, w2: number) =>
  w1 / 2 + w2 / 2 + Math.min(size.w, size.h) * 0.05;

/** Generate a fresh arrangement: 1-2 viewport-sweeping lines that never touch. */
export function generateLines(size: Size, rng: Rng = Math.random): PatternLine[] {
  const baseW = Math.max(60, Math.min(size.w, size.h) * 0.14);
  const count = rng() < 0.45 ? 2 : 1;
  const next: PatternLine[] = [];

  const w1 = rand(rng, baseW * 0.85, baseW * 1.2);
  const l1 = makeLine(size, w1, rng);
  if (l1) next.push(l1);

  if (count === 2 && l1) {
    const w2 = rand(rng, baseW * 0.85, baseW * 1.2);
    const clearance = clearanceFor(size, l1.w, w2);
    for (let tries = 0; tries < 80; tries++) {
      const cand = makeLine(size, w2, rng);
      if (cand && polyMinDist(l1.pts, cand.pts) >= clearance) {
        next.push(cand);
        break;
      }
    }
  }
  return next;
}

// --- rotation planning --------------------------------------------------------

function randRot(rng: Rng, rotationMin: number, rotationMax: number): number {
  return ((rand(rng, rotationMin, rotationMax) * Math.PI) / 180) * (rng() < 0.5 ? 1 : -1);
}

function rotatedTarget(
  size: Size,
  line: PatternLine,
  rotationMin: number,
  rotationMax: number,
  rng: Rng
): PatternLine | null {
  for (let tries = 0; tries < 30; tries++) {
    const cand = buildFromParams(size, {
      ...line,
      angA: line.angA + randRot(rng, rotationMin, rotationMax),
      angB: line.angB + randRot(rng, rotationMin, rotationMax)
    });
    if (polyCoverage(size, cand.pts) >= 0.25) return cand;
  }
  return null;
}

// Everything rotates by the same delta — shapes can't collide if they didn't
// before, so this is the guaranteed fallback.
function rigidTargets(
  size: Size,
  cur: PatternLine[],
  rotationMin: number,
  rotationMax: number,
  rng: Rng
): PatternLine[] {
  const d = randRot(rng, rotationMin, rotationMax);
  return cur.map((l) => buildFromParams(size, { ...l, angA: l.angA + d, angB: l.angB + d }));
}

/** Interpolate every line's endpoint angles toward its target at eased progress `e`. */
export function interpolateLines(
  size: Size,
  from: PatternLine[],
  targets: PatternLine[],
  e: number
): PatternLine[] {
  return from.map((fp, i) =>
    buildFromParams(size, {
      ...fp,
      angA: fp.angA + (targets[i].angA - fp.angA) * e,
      angB: fp.angB + (targets[i].angB - fp.angB) * e
    })
  );
}

/**
 * Plan a rotation: each endpoint moves by its own random amount within
 * [rotationMin, rotationMax] degrees, so the chord reshapes rather than
 * spinning rigidly. For two lines, both the destination AND the tween path
 * are collision-checked; if no safe permutation is found, fall back to a
 * rigid spin (which preserves the existing gap). Always returns one target
 * per input line.
 */
export function planRotation(
  size: Size,
  cur: PatternLine[],
  rotationMin: number,
  rotationMax: number,
  rng: Rng = Math.random
): PatternLine[] {
  if (cur.length === 1) {
    const t = rotatedTarget(size, cur[0], rotationMin, rotationMax, rng);
    return t ? [t] : rigidTargets(size, cur, rotationMin, rotationMax, rng);
  }

  const clearance = clearanceFor(size, cur[0].w, cur[1].w);
  for (let tries = 0; tries < 200; tries++) {
    const t0 = rotatedTarget(size, cur[0], rotationMin, rotationMax, rng);
    const t1 = rotatedTarget(size, cur[1], rotationMin, rotationMax, rng);
    if (!t0 || !t1) continue;
    if (polyMinDist(t0.pts, t1.pts) < clearance) continue;
    let ok = true;
    for (let s = 0.1; s < 1; s += 0.1) {
      const [a, b] = interpolateLines(size, cur, [t0, t1], s);
      if (polyMinDist(a.pts, b.pts) < clearance) {
        ok = false;
        break;
      }
    }
    if (ok) return [t0, t1];
  }
  return rigidTargets(size, cur, rotationMin, rotationMax, rng);
}

/**
 * On resize, keep the SAME lines: rescale waviness/width by the size change
 * and rebuild. Endpoints follow automatically because the housing circle is
 * derived from the current viewport while the angles stay fixed.
 */
export function rescaleLines(size: Size, prev: Size, lines: PatternLine[]): PatternLine[] {
  const ratio = Math.min(size.w, size.h) / (Math.min(prev.w, prev.h) || 1);
  return lines.map((l) =>
    buildFromParams(size, { ...l, a1: l.a1 * ratio, a2: l.a2 * ratio, amp: l.amp * ratio, w: l.w * ratio })
  );
}

export const easeInOutCubic = (p: number): number =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
