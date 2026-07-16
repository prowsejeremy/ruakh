import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

/**
 * Staggered reveal transition: elements rise 50px while fading in, and keep
 * rising another 50px (from the resting point) while fading out. Elements
 * whose transitions start in the same tick form a batch; each batch is
 * ordered top-to-bottom by viewport position and item N starts N × `step`
 * ms after the first, so consecutive items overlap by `duration - step`.
 */
export interface RevealParams {
  /** Travel distance in px. */
  y?: number;
  /** Per-item animation length in ms. */
  duration?: number;
  /** Gap between consecutive items' start times in ms. */
  step?: number;
  /** Base delay in ms added before the whole batch. */
  delay?: number;
  /** Manual stagger slot, overriding the measured position for this item. */
  index?: number;
  easing?: (t: number) => number;
  /** When false the transition is skipped entirely (instant). */
  enabled?: boolean;
  /** Opacity at the resting (fully-in) point; defaults to 1. */
  endOpacity?: number;
}

interface StaggerItem {
  top: number;
  left: number;
  /** Registration order — the tie-break when positions are identical. */
  seq: number;
  index?: number;
}

/**
 * Assigns each item its stagger slot. Items without a manual index are
 * ranked 0..k-1 among themselves by position (top, then left, then
 * registration order); a manual index is used verbatim.
 */
export function resolveStaggerOrder(items: StaggerItem[]): number[] {
  const resolved = new Array<number>(items.length).fill(0);
  const auto = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.index === undefined);
  auto.sort(
    (a, b) =>
      a.it.top - b.it.top || a.it.left - b.it.left || a.it.seq - b.it.seq,
  );
  auto.forEach(({ i }, rank) => (resolved[i] = rank));
  items.forEach((it, i) => {
    if (it.index !== undefined) resolved[i] = it.index;
  });
  return resolved;
}

interface BatchEntry {
  node: Element;
  index?: number;
  seq: number;
  slot: number;
}

// Ins and outs batch separately: a screen swap creates both directions in the
// same tick, and each side must count from slot 0.
const batches: Record<"in" | "out", BatchEntry[]> = { in: [], out: [] };
let seq = 0;

function flush(dir: "in" | "out") {
  const entries = batches[dir];
  if (entries.length === 0) return;
  batches[dir] = [];
  const slots = resolveStaggerOrder(
    entries.map((e) => {
      const rect = e.node.getBoundingClientRect();
      return { top: rect.top, left: rect.left, seq: e.seq, index: e.index };
    }),
  );
  entries.forEach((e, i) => (e.slot = slots[i]));
}

export function reveal(
  node: Element,
  params: RevealParams = {},
  options: { direction?: "in" | "out" | "both" } = {},
): TransitionConfig | (() => TransitionConfig) {
  const {
    y = 50,
    duration = 600,
    step = 100,
    delay = 0,
    index,
    easing = cubicOut,
    enabled = true,
    endOpacity = 1,
  } = params;
  if (!enabled) return { duration: 0 };

  const dir = options.direction === "out" ? "out" : "in";
  const entry: BatchEntry = { node, index, seq: seq++, slot: 0 };
  batches[dir].push(entry);
  // Deferred config: Svelte calls this after every same-tick transition has
  // registered, so the first call can measure and order the whole batch.
  // The microtask fallback clears entries whose transition never starts.
  queueMicrotask(() => flush(dir));
  return () => {
    flush(dir);
    if (
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return { duration: 0 };
    }
    const sign = dir === "out" ? -1 : 1;
    return {
      delay: delay + entry.slot * step,
      duration,
      easing,
      // In rises from +y to rest; out continues from rest up to -y.
      css: (t, u) =>
        `opacity: ${t * endOpacity}; transform: translateY(${sign * u * y}px);`,
    };
  };
}
