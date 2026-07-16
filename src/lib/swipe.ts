/**
 * Pure swipe-gesture decision, shared by the reflection slider.
 *
 * Returns the slide step for a horizontal swipe given the whole gesture:
 *   -1  swipe right  → previous slide
 *    0  not a swipe (too short, too slow, or vertical dominates)
 *   +1  swipe left   → next slide
 *
 * The time cap separates a deliberate flick from text selection or a lingering
 * drag: a swipe is a quick flick, whereas a selection drag is slow (and on touch
 * is preceded by a ~500ms long-press), so it exceeds `maxMs` and is ignored.
 *
 * Callers decide on `pointerup` for the full gesture, and re-run this on
 * `pointercancel` against the last `pointermove` position: on Android Chrome the
 * touch pointer stream can be ended by `pointercancel` (the browser handing the
 * gesture to the scroll compositor) before a usable `pointerup` arrives, so the
 * cancel path is the fallback that keeps swipes working there. Vertical-dominant
 * gestures fall through to native `touch-action: pan-y` scrolling either way.
 */
export const SWIPE_THRESHOLD = 40;
export const SWIPE_MAX_MS = 350;

export function swipeStep(
  dx: number,
  dy: number,
  dt: number,
  opts: { threshold?: number; maxMs?: number } = {}
): -1 | 0 | 1 {
  const threshold = opts.threshold ?? SWIPE_THRESHOLD;
  const maxMs = opts.maxMs ?? SWIPE_MAX_MS;
  if (dt > maxMs) return 0;
  if (Math.abs(dx) <= threshold || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}
