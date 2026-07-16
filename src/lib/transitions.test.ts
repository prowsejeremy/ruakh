import { describe, it, expect } from 'vitest';
import { resolveStaggerOrder, batchSpan, handoffDelay, reveal } from './transitions';
import type { TransitionConfig } from 'svelte/transition';

const item = (top: number, left = 0, seq = 0, index?: number) => ({ top, left, seq, index });

describe('resolveStaggerOrder', () => {
  it('returns an empty array for no items', () => {
    expect(resolveStaggerOrder([])).toEqual([]);
  });

  it('ranks items top to bottom regardless of registration order', () => {
    const order = resolveStaggerOrder([item(300, 0, 0), item(100, 0, 1), item(200, 0, 2)]);
    expect(order).toEqual([2, 0, 1]);
  });

  it('breaks top ties left to right', () => {
    const order = resolveStaggerOrder([item(100, 50, 0), item(100, 10, 1)]);
    expect(order).toEqual([1, 0]);
  });

  it('breaks top and left ties by registration order', () => {
    const order = resolveStaggerOrder([item(100, 0, 5), item(100, 0, 2)]);
    expect(order).toEqual([1, 0]);
  });

  it('uses a manual index verbatim without shifting auto ranks', () => {
    const order = resolveStaggerOrder([item(100, 0, 0), item(200, 0, 1, 9), item(300, 0, 2)]);
    // auto items rank 0 and 1 among themselves; the manual item keeps 9
    expect(order).toEqual([0, 9, 1]);
  });

  it('ranks a fully manual batch by the given indices', () => {
    const order = resolveStaggerOrder([item(0, 0, 0, 2), item(0, 0, 1, 0)]);
    expect(order).toEqual([2, 0]);
  });
});

const timed = (slot: number, step = 100, duration = 600, delay = 0) => ({
  slot,
  step,
  duration,
  delay
});

describe('batchSpan', () => {
  it('is zero for an empty batch', () => {
    expect(batchSpan([])).toBe(0);
  });

  it('is delay + duration for a single item at slot 0', () => {
    expect(batchSpan([timed(0)])).toBe(600);
  });

  it('counts the stagger offset of the last-starting item', () => {
    // slot 2 starts at 2 * step = 200ms, then runs for 600ms
    expect(batchSpan([timed(0), timed(1), timed(2)])).toBe(800);
  });

  it('takes the maximum end time, not the last registered', () => {
    expect(batchSpan([timed(3), timed(0)])).toBe(900);
  });

  it('adds the base delay', () => {
    expect(batchSpan([timed(1, 100, 600, 150)])).toBe(850);
  });
});

describe('handoffDelay', () => {
  it('is zero when the gate is fully open (concurrent)', () => {
    expect(handoffDelay(800, 0)).toBe(0);
  });

  it('is the whole span when the gate is closed (fully sequential)', () => {
    expect(handoffDelay(800, 1)).toBe(800);
  });

  it('is a fraction of the span for partial overlap', () => {
    expect(handoffDelay(800, 0.5)).toBe(400);
  });

  it('clamps a gate above 1 to the whole span', () => {
    expect(handoffDelay(800, 1.5)).toBe(800);
  });

  it('clamps a negative gate to zero', () => {
    expect(handoffDelay(800, -1)).toBe(0);
  });

  it('is zero when there is no out-batch to wait on', () => {
    expect(handoffDelay(0, 1)).toBe(0);
  });
});

// A stand-in for a DOM node: reveal() only reads getBoundingClientRect.
const node = (top = 0, left = 0) => ({
  getBoundingClientRect: () => ({ top, left })
}) as unknown as Element;

// reveal returns a deferred config factory when animating; call it to trigger
// the flush that measures the swap and read the resolved TransitionConfig.
const start = (r: ReturnType<typeof reveal>) =>
  (typeof r === 'function' ? r() : r) as TransitionConfig;

describe('reveal handoff coordination', () => {
  it('delays an in-batch by the out-batch span when both register in one swap', () => {
    // Register the swap's transitions (as Svelte would), then start them.
    const out = reveal(node(), { duration: 600, step: 100 }, { direction: 'out' });
    const inn = reveal(node(), { duration: 600, step: 100 });
    // out: one item at slot 0 → span 600; gate 1 → in waits the full 600.
    expect(start(inn).delay).toBe(600);
    expect(start(out).delay).toBe(0); // the leaving batch never waits
  });

  it('does not delay an in-batch when nothing is leaving', () => {
    const inn = reveal(node(), { duration: 600, step: 100 });
    expect(start(inn).delay).toBe(0);
  });

  it('waits on the slowest leaving item, not the first registered', () => {
    // Two leaving items; the lower one (top 300) staggers to slot 1 → span 700.
    reveal(node(0), { duration: 600, step: 100 }, { direction: 'out' });
    reveal(node(300), { duration: 600, step: 100 }, { direction: 'out' });
    const inn = reveal(node(), { duration: 600, step: 100 });
    expect(start(inn).delay).toBe(700);
  });
});
