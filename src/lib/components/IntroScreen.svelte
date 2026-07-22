<script lang="ts">
  import { onMount } from 'svelte';
  import Reveal from '$lib/components/Reveal.svelte';
  import Logo from '$lib/components/Logo.svelte';

  // Fired once the circle has faded out; the caller flips `intro.done`, which
  // swaps in the reflection screen (phase 6) and ungates the background pattern
  // (phase 7). Replaces the old fixed INTRO_MS timeout in +page.svelte.
  let { oncomplete }: { oncomplete?: () => void } = $props();

  // The single source of truth for the sequence. Durations are pushed to CSS
  // custom properties on the section below, so the JS clock and the CSS
  // transitions can never drift apart.
  const T = {
    circleIn: { at: 100, dur: 800 }, // 0 · circle fades in
    draw: { at: 200, dur: 800 }, // 1 · stroke draws (direction: --draw-from)
    logoIn: { at: 900, dur: 300 }, // 2 · stroke fills + logo reveals in (right after draw)
    grow: { at: 1900, dur: 600 }, // 3 · stroke → fill, scale up to full height
    logoOut: { at: 2400, dur: 300 }, // 4 · logo reveals out
    circleOut: { at: 3000, dur: 400 }, // 5 · circle fades to background
    complete: 3200 // → oncomplete (reflection + pattern take over)
  } as const;

  // The intro is server-rendered (intro.done starts false), so gating on a
  // client-only `mounted` flag makes Svelte *create* the content after
  // hydration — the only path on which its transitions actually play.
  let mounted = $state(false);
  // 0 blank · 1 circle in · 2 draw · 3 fill+logo · 4 grow · 5 logo out ·
  // 6 circle out · 7 done
  let phase = $state(0);

  // Logo is present across phases 3–4 (fill + grow), so `reveal` plays its
  // intro alongside the fill and its outro when phase advances to 5 (logo out).
  const showLogo = $derived(phase >= 3 && phase < 5);

  onMount(() => {
    mounted = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    at(T.circleIn.at, () => (phase = 1));
    at(T.draw.at, () => (phase = 2));
    at(T.logoIn.at, () => (phase = 3));
    at(T.grow.at, () => (phase = 4));
    at(T.logoOut.at, () => (phase = 5));
    at(T.circleOut.at, () => (phase = 6));
    at(T.complete, () => {
      phase = 7;
      oncomplete?.();
    });

    return () => timers.forEach(clearTimeout);
  });
</script>

<section
  class="intro"
  class:circleIn={phase >= 1}
  class:drawn={phase >= 2}
  class:filled={phase >= 3}
  class:grown={phase >= 4}
  class:circleOut={phase >= 6}
  style="--circle-in-dur:{T.circleIn.dur}ms; --draw-dur:{T.draw.dur}ms; --fill-dur:{T.logoIn.dur}ms; --grow-dur:{T.grow.dur}ms; --circle-out-dur:{T.circleOut.dur}ms;"
>
  {#if mounted}
    <div class="circleWrap">
      <svg class="circle" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          pathLength="1"
          d="M161.379,46.182C142.604,43.352 111.096,38.622 71.384,83.417C27.743,132.647 63.046,207.141 79.187,226.863C112.494,267.561 188.588,257.044 212.536,243C217.837,239.891 237.801,231.492 245.527,194.891C249.416,176.47 251.792,126.785 231.889,96.048C214.3,68.883 178.636,49.919 161.939,46.406"
        />
      </svg>
    </div>

    <!-- The optical-centering offset lives on the wrapper so the reveal's own
         transform (on its inner wrapper) never overwrites it. -->
    {#if showLogo}
      <div class="logo">
        <Reveal>
          <Logo className="logo" size={'60vw'} />
        </Reveal>
      </div>
    {/if}
  {/if}
</section>

<style>
  /* Fixed, non-interactive overlay above the (still hidden) pattern; the
     reflection screen mounts underneath once the intro hands off. */
  section {
    position: fixed;
    inset: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    --transition-timing: cubic-bezier(0.6, -0.2, 0.8, 0.8);
  }

  /* Base circle box is sized in vh so the grow factor is a constant: 40vh × 2.5
     = 100vh tall. Change one and change the other (--grow scale below). */
  .circleWrap {
    position: absolute;
    z-index: 1;
    width: 40vh;
    height: 40vh;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(1);
    opacity: 0;
    transition:
      opacity var(--circle-in-dur) var(--transition-timing),
      transform var(--grow-dur) var(--transition-timing),
      opacity var(--circle-out-dur) ease;

    section.circleIn & {
      opacity: 1;
    }
    section.grown & {
      transform: scale(4);

      @media screen and (min-width: 768px) {
        transform: scale(8);
      }
    }
    section.circleOut & {
      opacity: 0;
    }
  }
  .circle {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;

    path {
      stroke: var(--color-accent);
      stroke-width: 20px;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: var(--color-accent);
      fill-opacity: 0;
      /* pathLength is normalized to 1, so one unit dashes the whole outline.
         Flip --draw-from to -1 to reverse the draw direction. */
      stroke-dasharray: 1;
      stroke-dashoffset: var(--draw-from, 1);
      transition:
        stroke-dashoffset var(--draw-dur) linear,
        fill-opacity var(--fill-dur) var(--transition-timing);
    }

    section.drawn & {
      animation: rotate 10s linear infinite;

      path {
        stroke-dashoffset: 0;
      }
    }
    section.filled & path {
      fill-opacity: 1;
    }
  }
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-90deg);
    }
  }

  .logo {
    position: absolute;
    z-index: 2;
    margin: 0 auto;
    :global(svg) {
      max-width: 20rem;
      height: auto;
      display: block;
      margin: 0 auto;
    }
  }
</style>
