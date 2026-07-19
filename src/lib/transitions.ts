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

/**
 * Wall-clock ms from a batch's start until its last-finishing item completes.
 * Zero for an empty batch. Each item ends at `delay + slot*step + duration`;
 * the span is the maximum across the batch (the slowest chain, not the last
 * registered).
 */
export function batchSpan(
  items: { slot: number; step: number; duration: number; delay: number }[],
): number {
  return items.reduce(
    (max, it) => Math.max(max, it.delay + it.slot * it.step + it.duration),
    0,
  );
}

/**
 * How long an entering batch waits so a leaving batch can (partly) clear first.
 * `gate` 0 = concurrent (today's behaviour, no wait); 1 = fully sequential (wait
 * the whole out-span); values between overlap the two. Clamped to [0, 1].
 */
export function handoffDelay(outSpan: number, gate: number): number {
  return outSpan * Math.min(1, Math.max(0, gate));
}

// How much of the leaving batch's span the entering batch waits through before
// it starts. Tunable knob for the intro→home handoff: 0 restores the fully
// concurrent look, 1 is fully sequential, in-between is a partial overlap.
const HANDOFF_GATE = 1;

interface BatchEntry {
  node: Element;
  index?: number;
  seq: number;
  slot: number;
  step: number;
  duration: number;
  delay: number;
  /** Extra lead-in applied to `in` entries so a leaving batch clears first. */
  handoff: number;
}

// Ins and outs batch separately: a screen swap creates both directions in the
// same tick, and each side must count from slot 0.
const batches: Record<"in" | "out", BatchEntry[]> = { in: [], out: [] };
let seq = 0;

function measureSlots(entries: BatchEntry[]) {
  const slots = resolveStaggerOrder(
    entries.map((e) => {
      const rect = e.node.getBoundingClientRect();
      return { top: rect.top, left: rect.left, seq: e.seq, index: e.index };
    }),
  );
  entries.forEach((e, i) => (e.slot = slots[i]));
}

// Both directions flush together in a single pass: a screen swap registers its
// out and in transitions in the same synchronous tick, so the first flush of
// the tick (from Svelte's deferred-config call, or the microtask fallback)
// measures the whole out batch and applies its span as the in batch's handoff.
// Coordinating them here — rather than storing the out span across flushes —
// means no ordering dependency and no stale span leaking into a later nav.
function flush() {
  const out = batches.out;
  const inn = batches.in;
  if (out.length === 0 && inn.length === 0) return;
  batches.out = [];
  batches.in = [];
  measureSlots(out);
  measureSlots(inn);
  const handoff = handoffDelay(batchSpan(out), HANDOFF_GATE);
  inn.forEach((e) => (e.handoff = handoff));
}

/**
 * Staggered reveal usable as an `in:` / `out:` transition.
 *
 * ## Usage convention (avoids the "new page stacks at the bottom" bug)
 *
 * During a SvelteKit page swap the outgoing and incoming pages briefly share
 * normal document flow, so incoming content lays out *below* the still-leaving
 * content. This transition hides that by holding the incoming batch back
 * (`handoff`) until the outgoing batch clears — but that only works if every
 * screen follows the same rule. When adding reveals to a page, classify each
 * top-level element:
 *
 * - **Standalone block** (a lone section, a search box) → `in:reveal|global
 *   out:reveal|global` (both directions).
 * - **Container whose children stagger** (a nav, list, or grid) → the container
 *   carries `out:reveal|global` only; each repeated child carries
 *   `in:reveal|global` only. (Putting `in` on both double-animates.)
 * - **Empty-state placeholder** shown in a container's `{:else}` → `in:reveal|global`.
 *
 * The invariant that prevents stacking: every incoming top-level element has an
 * `in` (so it respects the handoff), and every outgoing container has an `out`
 * (so there is an out-span for the next page's `in` batch to wait on). A shared
 * layout that owns a single persistent frame (see `routes/preferences`) is the
 * other half — a persistent wrapper can never stack behind an outgoing page.
 */
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
  const entry: BatchEntry = {
    node,
    index,
    seq: seq++,
    slot: 0,
    step,
    duration,
    delay,
    handoff: 0,
  };
  batches[dir].push(entry);
  // Deferred config: Svelte calls this after every same-tick transition has
  // registered, so the first call can measure and order the whole batch.
  // The microtask fallback clears entries whose transition never starts.
  queueMicrotask(flush);
  return () => {
    flush();
    const sign = dir === "out" ? -1 : 1;
    return {
      delay: delay + entry.handoff + entry.slot * step,
      duration,
      easing,
      // In rises from +y to rest; out continues from rest up to -y.
      css: (t, u) =>
        `opacity: ${t * endOpacity}; transform: translateY(${sign * u * y}px);`,
    };
  };
}
