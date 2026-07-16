<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import {
    generateLines,
    planRotation,
    interpolateLines,
    rescaleLines,
    easeInOutCubic,
    type PatternLine
  } from '$lib/pattern';

  /**
   * Procedural pattern background: 1-2 thick curved lines that never touch.
   * The lines rotate to a fresh, collision-free arrangement whenever
   * `routeKey` changes — pass the current path so it animates per navigation.
   * All geometry lives in $lib/pattern (pure, unit-tested); this component
   * owns only viewport state, the animation loop, and the markup.
   */

  type Props = {
    /** viewport background color */
    background?: string;
    /** line color; pass an array to color lines individually */
    lineColor?: string | string[];
    /** change this (e.g. current path) to trigger a rotation */
    routeKey?: unknown;
    /** per-endpoint rotation range on change (degrees) */
    rotationMin?: number;
    rotationMax?: number;
    /** rotation animation length (ms) */
    duration?: number;
    /** stacking; the layer is pointer-events:none */
    zIndex?: number;
  };

  let {
    background = 'var(--color-bg)',
    lineColor = 'var(--color-accent)',
    routeKey = undefined,
    rotationMin = 20,
    rotationMax = 60,
    duration = 850,
    zIndex = 0
  }: Props = $props();

  let lines = $state<PatternLine[]>([]);
  let W = $state(1200);
  let H = $state(800);
  let mounted = false;
  let lastKey: unknown;
  let raf = 0;

  const size = () => ({ w: W, h: H });
  const strokeFor = (i: number) =>
    Array.isArray(lineColor) ? lineColor[i % lineColor.length] : lineColor;

  function measure() {
    W = window.innerWidth || 1200;
    H = window.innerHeight || 800;
  }

  function rotate() {
    if (!lines.length) {
      lines = generateLines(size());
      return;
    }
    const from = lines.map((l) => ({ ...l }));
    const targets = planRotation(size(), from, rotationMin, rotationMax);

    // Respect reduced-motion preferences: jump straight to the new arrangement.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lines = targets;
      return;
    }

    cancelAnimationFrame(raf);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      lines = interpolateLines(size(), from, targets, easeInOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  onMount(() => {
    measure();
    lines = generateLines(size());
    lastKey = routeKey; // don't rotate on first render
    mounted = true;

    const onResize = () => {
      const prev = size();
      measure();
      lines = lines.length ? rescaleLines(size(), prev, lines) : generateLines(size());
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  });

  // Rotate whenever routeKey changes (after the initial mount). untrack() so
  // the effect depends only on routeKey — rotate() writes `lines`, which must
  // not become a dependency (it would loop).
  $effect(() => {
    const key = routeKey;
    if (!mounted || key === lastKey) return;
    lastKey = key;
    untrack(() => rotate());
  });
</script>

<div class="pattern-bg" style="background:{background}; z-index:{zIndex};">
  <span class="background-texture"></span>
  <svg width="100%" height="100%" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">
    {#each lines as line, i (i)}
      <path
        d={line.d}
        fill="none"
        style="stroke: {strokeFor(i)}"
        stroke-width={line.w}
        stroke-linecap="round"
        stroke-linejoin="round"
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
  }
  .pattern-bg svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .background-texture {
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
  }
</style>
