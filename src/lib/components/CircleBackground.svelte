<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { reveal } from '$lib/transitions';
  import { placeCircles, type CirclePlacement } from '$lib/circle-pattern';

  /**
   * Static circle background: two large outlines of the intro's circle path,
   * dropped at random on load — always spilling past a viewport edge, never
   * overlapping (geometry in $lib/circle-pattern). Generated once; it does not
   * move on navigation, unlike PatternBackground's per-route rotation.
   */

  // The organic circle from IntroScreen.
  const CIRCLE_PATH =
    'M161.379,46.182C142.604,43.352 111.096,38.622 71.384,83.417C27.743,132.647 63.046,207.141 79.187,226.863C112.494,267.561 188.588,257.044 212.536,243C217.837,239.891 237.801,231.492 245.527,194.891C249.416,176.47 251.792,126.785 231.889,96.048C214.3,68.883 178.636,49.919 161.939,46.406';

  // Match the old pattern's reveal beat (draws in just after the reflection).
  const LINE_REVEAL_DELAY = 400;

  type Props = {
    /** viewport background color */
    background?: string;
    /** stroke color */
    lineColor?: string;
    /** hold the circles back until true — the home intro gating */
    revealLines?: boolean;
    /** circle size range in px — each circle picks a random size in [min,max] */
    minSize?: number;
    maxSize?: number;
    /** how much the circles may overlap, 0–1 — higher packs them closer */
    overlap?: number;
    /** rendered stroke width in px, constant across circle sizes */
    strokeWidth?: number;
    /** stacking; the layer is pointer-events:none */
    zIndex?: number;
  };

  let {
    background = 'var(--color-bg)',
    lineColor = 'var(--color-accent)',
    revealLines = true,
    minSize = 800,
    maxSize = 1500,
    overlap = 0.35,
    strokeWidth = 70,
    zIndex = 0
  }: Props = $props();

  let circles = $state<CirclePlacement[]>([]);
  let mounted = false;

  function generate() {
    circles = placeCircles({ w: window.innerWidth, h: window.innerHeight }, { minSize, maxSize, overlap });
  }

  onMount(() => {
    mounted = true;
    if (revealLines) generate();
  });

  // Generate once the gate opens after mount (the home intro finishing). Static
  // thereafter — no regeneration on navigation or resize.
  $effect(() => {
    if (revealLines && mounted && circles.length === 0) {
      untrack(() => generate());
    }
  });
</script>

<div class="pattern-bg" style="background:{background}; z-index:{zIndex};">
  <span class="background-texture"></span>
  {#each circles as c, i (i)}
    <!-- reveal animates this wrapper (its only transform); the svg carries the
         rotation, so the two never fight over `transform`. -->
    <div
      class="circle-pos"
      style="left:{c.cx - c.size / 2}px; top:{c.cy - c.size / 2}px; width:{c.size}px; height:{c.size}px;"
      in:reveal={{ delay: LINE_REVEAL_DELAY }}
    >
      <svg
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style="transform: rotate({c.rotation}deg); stroke:{lineColor};"
      >
        <path
          d={CIRCLE_PATH}
          fill="none"
          stroke-width={strokeWidth}
          vector-effect="non-scaling-stroke"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  {/each}
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
  .circle-pos {
    position: absolute;

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
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
