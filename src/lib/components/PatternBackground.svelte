<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import {reveal} from '$lib/transitions';
  import { patternBackground } from '$lib/client/background.svelte';
  import {
    generateLines,
    rescaleLines,
    type PatternLine
  } from '$lib/pattern';

  /**
   * Procedural pattern background: 1-2 thick curved lines that never touch.
   * The lines are generated once and stay put across navigation — only a
   * viewport resize repositions them (rescaled in place, same arrangement).
   * All geometry lives in $lib/pattern (pure, unit-tested); this component
   * owns only viewport state and the markup.
   */

  type Props = {
    /** viewport background color */
    background?: string;
    /** line color; pass an array to color lines individually */
    lineColor?: string | string[];
    /** hold the lines back until true — lets the intro draw them in only
     *  after the reflection has loaded (see the root layout) */
    revealLines?: boolean;
    /** stacking; the layer is pointer-events:none */
    zIndex?: number;
  };

  let {
    background = 'var(--color-bg)',
    lineColor = 'var(--color-accent)',
    revealLines = true,
    zIndex = 0
  }: Props = $props();

  // Delay the lines' reveal a beat so, on the home intro, they draw in just
  // after the reflection has appeared rather than alongside it.
  const LINE_REVEAL_DELAY = 400;

  let lines = $state<PatternLine[]>([]);
  let W = $state(1200);
  let H = $state(800);
  let mounted = false;

  const size = () => ({ w: W, h: H });
  const strokeFor = (i: number) =>
    Array.isArray(lineColor) ? lineColor[i % lineColor.length] : lineColor;

  function measure() {
    W = window.innerWidth || 1200;
    H = window.innerHeight || 800;
  }

  onMount(() => {
    measure();
    if (revealLines) lines = generateLines(size());
    mounted = true;

    // Resize keeps the SAME arrangement — rescaled in place, not regenerated.
    // Navigation never regenerates: the lines are static once drawn.
    const onResize = () => {
      const prev = size();
      measure();
      if (lines.length) lines = rescaleLines(size(), prev, lines);
      else if (revealLines) lines = generateLines(size());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  // When the gate opens after mount (the home intro finishing), generate the
  // lines so their `in:reveal` plays. No-op elsewhere: other routes pass
  // revealLines=true and generate on mount above.
  $effect(() => {
    if (revealLines && mounted && lines.length === 0) {
      untrack(() => (lines = generateLines(size())));
    }
  });
</script>

<div class="pattern-bg" style="background:{background}; z-index:{zIndex};">
  <!-- <span class="background-texture"></span> -->
  <!-- Only the line layer fades — the parent keeps painting the viewport bg.
       Any screen can hide the lines via patternBackground.visible. -->
  <svg
    class="lines"
    class:hidden={!patternBackground.visible}
    width="100%"
    height="100%"
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="xMidYMid slice"
  >
    {#each lines as line, i (i)}
      <path
        d={line.d}
        fill="none"
        style="stroke: {strokeFor(i)}"
        stroke-width="80"
        stroke-linecap="round"
        stroke-linejoin="round"
        in:reveal={{ delay: LINE_REVEAL_DELAY }}
      />
    {/each}
  </svg>
</div>

<style>
  .pattern-bg {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  /* Cross-fade the lines when a screen toggles patternBackground.visible.
     Independent of the one-time per-path draw-in (in:reveal). */
  .lines {
    transition: opacity 600ms var(--transition-timing) 300ms;
  }
  .lines.hidden {
    opacity: 0;
  }
  /* .background-texture {
    background-image: url('/texture.jpg');
    background-size: cover;
    background-position: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: multiply;
    opacity: 0.5;
  } */
</style>
