// Audio for the /breathe exercise: one looping background music track plus a
// short voice cue at the start of each phase. Pure orchestration over an
// injected Audio factory so it runs under Vitest's node environment.

export type CueName = "inhale" | "pause" | "exhale";

/** The slice of HTMLAudioElement this controller drives. */
export interface AudioLike {
  loop: boolean;
  volume: number;
  currentTime: number;
  muted: boolean;
  play(): Promise<void>;
  pause(): void;
}

export interface BreatheAudio {
  /** Begin a session: restart the background track (if music is on) and prime the cues. */
  start(): void;
  /** End the session: silence cues and fade the background out. */
  stop(): void;
  /** Play a voice cue from the top (no-op unless started and the guide is on). */
  cue(name: CueName): void;
  setMusicEnabled(on: boolean): void;
  setGuideEnabled(on: boolean): void;
  /** Silence everything and cancel timers (component unmount). */
  destroy(): void;
}

const FADE_STEPS = 10;

export function createBreatheAudio({
  backgroundSrc,
  cueSrcs,
  createAudio = (src) => new Audio(src),
  fadeMs = 800,
}: {
  backgroundSrc: string;
  /** A null src disables that cue — its `cue()` calls become no-ops. */
  cueSrcs: Record<CueName, string | null>;
  createAudio?: (src: string) => AudioLike;
  fadeMs?: number;
}): BreatheAudio {
  const background = createAudio(backgroundSrc);
  background.loop = true;
  const cues: Partial<Record<CueName, AudioLike>> = {};
  for (const name of ["inhale", "pause", "exhale"] as const) {
    const src = cueSrcs[name];
    if (src) cues[name] = createAudio(src);
  }
  const eachCue = (fn: (cue: AudioLike) => void) =>
    Object.values(cues).forEach(fn);

  let musicEnabled = true;
  let guideEnabled = true;
  let running = false;
  let primed = false;
  let fadeTimer: ReturnType<typeof setInterval> | undefined;

  // play() rejections (autoplay policy, decode failure) must never surface —
  // the audio is an enhancement; the exercise itself owns the experience.
  const tryPlay = (audio: AudioLike) => void audio.play().catch(() => {});

  const clearFade = () => {
    clearInterval(fadeTimer);
    fadeTimer = undefined;
  };

  // iOS only lets play() succeed on elements first played inside a user
  // gesture. start() runs in the start-button click, so a muted play/pause
  // here unlocks the cue elements for the timer-driven plays that follow.
  const primeCues = () => {
    if (primed) return;
    primed = true;
    eachCue((cue) => {
      cue.muted = true;
      cue
        .play()
        .catch(() => {})
        .then(() => {
          cue.pause();
          cue.currentTime = 0;
          cue.muted = false;
        });
    });
  };

  const resetBackground = () => {
    background.pause();
    background.currentTime = 0;
    background.volume = 1;
  };

  const fadeOutBackground = () => {
    clearFade();
    const step = 1 / FADE_STEPS;
    fadeTimer = setInterval(() => {
      if (background.volume > step) {
        background.volume -= step;
      } else {
        clearFade();
        resetBackground();
      }
    }, fadeMs / FADE_STEPS);
  };

  return {
    start() {
      clearFade();
      running = true;
      background.volume = 1;
      background.currentTime = 0;
      if (musicEnabled) tryPlay(background);
      primeCues();
    },

    stop() {
      if (!running) return;
      running = false;
      eachCue((cue) => cue.pause());
      fadeOutBackground();
    },

    cue(name) {
      const cue = cues[name];
      if (!cue || !running || !guideEnabled) return;
      cue.currentTime = 0;
      tryPlay(cue);
    },

    setMusicEnabled(on) {
      musicEnabled = on;
      if (!running) return;
      if (on) tryPlay(background);
      else background.pause();
    },

    setGuideEnabled(on) {
      guideEnabled = on;
      if (!on) eachCue((cue) => cue.pause());
    },

    destroy() {
      clearFade();
      running = false;
      background.pause();
      eachCue((cue) => cue.pause());
    },
  };
}
