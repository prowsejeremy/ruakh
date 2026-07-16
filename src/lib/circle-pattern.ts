/**
 * Placement geometry for the circle background: N large circles dropped at
 * random, each a random size, each spilling past a viewport edge and never
 * overlapping. Pure and unit-tested; the component owns only measurement and
 * markup.
 */

export type Size = { w: number; h: number };

export interface CirclePlacement {
  /** center x in px — may sit outside the viewport (the circle spills in) */
  cx: number;
  cy: number;
  /** width & height in px (the circle is square) — varies per circle */
  size: number;
  /** rotation in degrees, 0–360, for organic variety */
  rotation: number;
}

export interface PlaceOptions {
  /** smallest circle width/height in px */
  minSize?: number;
  /** largest circle width/height in px */
  maxSize?: number;
  /** how many circles (default 2) */
  count?: number;
  /** how much the bounding circles may overlap, 0–1 (the drawn blob fills only
   *  ~¾ of its box, so some box overlap still leaves the strokes clear); larger
   *  = circles sit closer */
  overlap?: number;
  /** minimum px between the (overlap-reduced) bounding circles */
  gap?: number;
  /** furthest a center may sit outside an edge, as a fraction of the radius */
  out?: number;
  /** rejection-sampling attempts per circle before falling back */
  tries?: number;
  /** injectable RNG for deterministic layouts (defaults to Math.random) */
  rng?: () => number;
}

/** True when the circle's bounding box crosses at least one viewport edge. */
function spills(cx: number, cy: number, r: number, vp: Size): boolean {
  return cx - r < 0 || cx + r > vp.w || cy - r < 0 || cy + r > vp.h;
}

/**
 * Random placement via rejection sampling: each candidate must spill and must
 * clear every already-placed circle by the sum of their radii plus `gap`.
 * Returns null if any circle can't be placed within `tries` — the caller then
 * uses the deterministic fallback so a layout is always produced.
 */
function sample(vp: Size, sizes: number[], overlap: number, gap: number, out: number, tries: number, rng: () => number): CirclePlacement[] | null {
  const placed: CirclePlacement[] = [];

  for (const size of sizes) {
    const r = size / 2;
    const minX = -out * r;
    const maxX = vp.w + out * r;
    const minY = -out * r;
    const maxY = vp.h + out * r;
    let ok = false;
    for (let t = 0; t < tries && !ok; t++) {
      const cx = minX + rng() * (maxX - minX);
      const cy = minY + rng() * (maxY - minY);
      if (!spills(cx, cy, r, vp)) continue;
      const clears = placed.every(
        (p) => Math.hypot(p.cx - cx, p.cy - cy) >= (r + p.size / 2) * (1 - overlap) + gap
      );
      if (!clears) continue;
      placed.push({ cx, cy, size, rotation: rng() * 360 });
      ok = true;
    }
    if (!ok) return null;
  }
  return placed;
}

/**
 * Deterministic non-overlapping layout at expanded-box corners, used when
 * random sampling can't fit the circles (small viewports, or an unlucky draw).
 * Sized for the two-circle case: the excursion is grown until opposite corners
 * clear the two largest radii, so a two-circle layout never overlaps on any
 * real viewport.
 */
function fallback(vp: Size, sizes: number[], overlap: number, gap: number, out: number, rng: () => number): CirclePlacement[] {
  const radii = sizes.map((s) => s / 2).sort((a, b) => b - a);
  const target = (radii[0] + (radii[1] ?? radii[0])) * (1 - overlap) + gap;
  // Grow the excursion so corners along each axis reach at least target/√2;
  // then the diagonal between opposite corners is at least `target`.
  const e = Math.max(out * radii[0], (target / Math.SQRT2 - Math.min(vp.w, vp.h)) / 2);
  const corners = [
    { cx: -e, cy: -e },
    { cx: vp.w + e, cy: vp.h + e },
    { cx: vp.w + e, cy: -e },
    { cx: -e, cy: vp.h + e }
  ];
  return sizes.map((size, i) => {
    const c = corners[i % corners.length];
    return { cx: c.cx, cy: c.cy, size, rotation: rng() * 360 };
  });
}

export function placeCircles(vp: Size, opts: PlaceOptions = {}): CirclePlacement[] {
  const {
    minSize = 800,
    maxSize = 1500,
    count = 2,
    overlap = 0.35,
    gap = 0,
    out = 0.45,
    tries = 200,
    rng = Math.random
  } = opts;

  const ov = Math.min(0.95, Math.max(0, overlap));

  // Fix each circle's size up front so the sampler and the fallback agree.
  const sizes = Array.from({ length: count }, () => minSize + rng() * (maxSize - minSize));

  return sample(vp, sizes, ov, gap, out, tries, rng) ?? fallback(vp, sizes, ov, gap, out, rng);
}
