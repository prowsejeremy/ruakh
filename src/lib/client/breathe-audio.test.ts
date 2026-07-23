import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBreatheAudio, type AudioLike } from './breathe-audio';

class FakeAudio implements AudioLike {
  loop = false;
  volume = 1;
  currentTime = 0;
  muted = false;
  paused = true;
  plays: { muted: boolean; from: number }[] = [];
  constructor(public src: string) {}
  play() {
    this.paused = false;
    this.plays.push({ muted: this.muted, from: this.currentTime });
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

const FADE_MS = 800;

function setup() {
  const created: Record<string, FakeAudio> = {};
  const player = createBreatheAudio({
    backgroundSrc: 'bg',
    cueSrcs: { inhale: 'inhale', pause: 'hold', exhale: 'exhale' },
    createAudio: (src) => (created[src] = new FakeAudio(src)),
    fadeMs: FADE_MS
  });
  return {
    player,
    bg: created.bg,
    cues: { inhale: created.inhale, pause: created.hold, exhale: created.exhale }
  };
}

/** Flush the microtask queue so play()-promise chains (cue priming) settle. */
const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('background music', () => {
  it('loops and plays from the top on start', () => {
    const { player, bg } = setup();
    bg.currentTime = 42; // as if left over from a previous session
    player.start();
    expect(bg.loop).toBe(true);
    expect(bg.paused).toBe(false);
    expect(bg.plays).toEqual([{ muted: false, from: 0 }]);
  });

  it('stays silent when music is toggled off before start', () => {
    const { player, bg } = setup();
    player.setMusicEnabled(false);
    player.start();
    expect(bg.paused).toBe(true);
  });

  it('pauses and resumes in place when toggled mid-session', () => {
    const { player, bg } = setup();
    player.start();
    bg.currentTime = 30;
    player.setMusicEnabled(false);
    expect(bg.paused).toBe(true);
    player.setMusicEnabled(true);
    expect(bg.paused).toBe(false);
    expect(bg.plays.at(-1)).toEqual({ muted: false, from: 30 });
  });

  it('does not play when toggled on outside a session', () => {
    const { player, bg } = setup();
    player.setMusicEnabled(false);
    player.setMusicEnabled(true);
    expect(bg.paused).toBe(true);
  });
});

describe('background fade-out on stop', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fades the volume down, then pauses and rewinds', () => {
    const { player, bg } = setup();
    player.start();
    player.stop();
    vi.advanceTimersByTime(FADE_MS / 2);
    expect(bg.paused).toBe(false);
    expect(bg.volume).toBeLessThan(1);
    expect(bg.volume).toBeGreaterThan(0);
    vi.advanceTimersByTime(FADE_MS);
    expect(bg.paused).toBe(true);
    expect(bg.currentTime).toBe(0);
    expect(bg.volume).toBe(1); // restored for the next session
  });

  it('cancels an in-flight fade when a new session starts', () => {
    const { player, bg } = setup();
    player.start();
    player.stop();
    vi.advanceTimersByTime(FADE_MS / 2);
    player.start();
    vi.advanceTimersByTime(FADE_MS * 2);
    expect(bg.paused).toBe(false);
    expect(bg.volume).toBe(1);
  });
});

describe('voice cues', () => {
  it('plays the named cue from the top during a session', async () => {
    const { player, cues } = setup();
    player.start();
    await flushMicrotasks(); // let priming settle, as it will have in real use
    cues.inhale.currentTime = 0.4; // as if it had played before
    player.cue('inhale');
    expect(cues.inhale.plays.at(-1)).toEqual({ muted: false, from: 0 });
    expect(cues.inhale.paused).toBe(false);
  });

  it('ignores cues before start and after stop', async () => {
    const { player, cues } = setup();
    player.cue('exhale');
    expect(cues.exhale.plays).toEqual([]);
    player.start();
    await flushMicrotasks();
    player.stop();
    cues.exhale.plays = [];
    player.cue('exhale');
    expect(cues.exhale.plays).toEqual([]);
  });

  it('ignores cues while the guide is off, and silences a playing one', async () => {
    const { player, cues } = setup();
    player.start();
    await flushMicrotasks();
    player.cue('pause');
    player.setGuideEnabled(false);
    expect(cues.pause.paused).toBe(true);
    cues.pause.plays = [];
    player.cue('inhale');
    expect(cues.inhale.plays.filter((p) => !p.muted)).toEqual([]);
    player.setGuideEnabled(true);
    player.cue('inhale');
    expect(cues.inhale.plays.at(-1)).toEqual({ muted: false, from: 0 });
  });

  it('skips cues whose src is null', async () => {
    const created: Record<string, FakeAudio> = {};
    const player = createBreatheAudio({
      backgroundSrc: 'bg',
      cueSrcs: { inhale: 'inhale', pause: null, exhale: 'exhale' },
      createAudio: (src) => (created[src] = new FakeAudio(src)),
      fadeMs: FADE_MS
    });
    expect(Object.keys(created).sort()).toEqual(['bg', 'exhale', 'inhale']);
    player.start();
    await flushMicrotasks();
    player.cue('pause'); // no element behind it — must be a safe no-op
    player.cue('inhale'); // the others still work
    expect(created.inhale.plays.at(-1)).toEqual({ muted: false, from: 0 });
  });

  it('primes each cue on start (muted play/pause) so iOS unlocks them', async () => {
    const { player, cues } = setup();
    player.start();
    await flushMicrotasks();
    for (const cue of Object.values(cues)) {
      expect(cue.plays[0]).toEqual({ muted: true, from: 0 });
      expect(cue.paused).toBe(true);
      expect(cue.muted).toBe(false);
      expect(cue.currentTime).toBe(0);
    }
  });
});

describe('destroy', () => {
  it('silences everything', () => {
    const { player, bg, cues } = setup();
    player.start();
    player.cue('inhale');
    player.destroy();
    expect(bg.paused).toBe(true);
    expect(cues.inhale.paused).toBe(true);
  });
});
