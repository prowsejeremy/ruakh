import { describe, it, expect } from 'vitest';
import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('allows up to the limit, then blocks within the window', () => {
    let t = 1000;
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => t });

    expect(rl.check('ip').allowed).toBe(true); // 1
    expect(rl.check('ip').allowed).toBe(true); // 2
    const third = rl.check('ip'); // 3 — last allowed
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = rl.check('ip'); // 4 — blocked
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSec).toBe(60); // full window remaining
  });

  it('resets once the window elapses', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 1, windowMs: 10_000, now: () => t });

    expect(rl.check('ip').allowed).toBe(true);
    expect(rl.check('ip').allowed).toBe(false);

    t = 10_000; // window boundary reached
    expect(rl.check('ip').allowed).toBe(true);
  });

  it('tracks each key independently', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 1, windowMs: 10_000, now: () => t });

    expect(rl.check('a').allowed).toBe(true);
    expect(rl.check('b').allowed).toBe(true); // different key, own budget
    expect(rl.check('a').allowed).toBe(false);
  });

  it('reports a partial retry-after part-way through a window', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 1, windowMs: 10_000, now: () => t });
    rl.check('ip');
    t = 3000; // 7s left in the window
    expect(rl.check('ip').retryAfterSec).toBe(7);
  });
});
