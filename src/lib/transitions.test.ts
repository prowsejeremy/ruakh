import { describe, it, expect } from 'vitest';
import { resolveStaggerOrder } from './transitions';

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
