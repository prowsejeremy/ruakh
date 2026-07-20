<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { reveal } from '$lib/transitions';
  import Icon from '$lib/components/Icon.svelte';
  import { patternBackground } from '$lib/client/background.svelte';
  import { actionsBar } from '$lib/client/actions-bar.svelte';

  // Timing lives in JS, like IntroScreen: setTimeout is the single clock and CSS
  // only transitions to whatever state class the clock sets. The durations are
  // also pushed to CSS custom properties on the wrapper below, so the JS delays
  // and the CSS transitions are driven from the same numbers.
  const REVEAL_MS = 600; // text reveal in-transition (matches Reveal's default)
  const CROSS_MS = 1000; // fill ↔ stroke crossfade at each phase change
  const STEP_MS = 3000; // the breathe (scale) / hold (stroke draw) itself
  const COUNT_FROM = 3; // seconds counted in before breathing begins
  const TOTAL_CYCLES = 14; // full box-breathing cycles before the exercise ends

  const INTRO_COPY =
    '<p>The Hebrew word for "breath" or "soul". It literally means the inhalation and exhalation of air.</p>' +
    '<p>The following breathing exercise, seeks to give you space to slow down and focus on the breath of life:</p>' +
    '<div class="breathe-instructions">' +
    '<p class="step"><span class="marker">01</span>Breathe in through your nose.</p>' +
    '<p class="step"><span class="marker">02</span>Hold</p>' +
    '<p class="step"><span class="marker">03</span>Breathe out through your mouth</p>' +
    '<p class="step"><span class="marker">04</span>Hold</p>' +
    '<p class="step">Repeat.</p>' +
    '</div>' +
    '<p>The exercise will go for 3 minutes, but feel free to stop at any time.</p>';
  const END_COPY =
    '<p>We hope you enjoyed taking a moment to pause and breathe. As you go, may you take ' +
    'with you the sustaining breath of your loving Father.</p>';

  // Box breathing. Each step reveals its cue, waits for that reveal to finish,
  // then animates the circle to `state` over STEP_MS before advancing. The four
  // end-states the circle rests on between steps:
  //   full     — solid blob, grown    (end of breathe in)
  //   holdFull — drawn outline, grown  (end of the first hold)
  //   rest     — solid blob, shrunk    (end of breathe out)
  //   holdRest — drawn outline, shrunk (end of the second hold)
  const STEPS = [
    { message: 'inhale', state: 'full' },
    { message: 'pause', state: 'holdFull' },
    { message: 'exhale', state: 'rest' },
    { message: 'pause', state: 'holdRest' }
  ] as const;

  // intro → countdown → breathing → end. Ending happens two ways that share the
  // same screen: the user closing early, or completing all TOTAL_CYCLES cycles.
  type Phase = 'intro' | 'countdown' | 'breathing' | 'end';
  let phase = $state<Phase>('intro');
  let stepIndex = $state(0);
  let count = $state(COUNT_FROM);
  // Start on the loop's pre-breathe-in state (holdRest) so the countdown and the
  // first breathe in hand off exactly like every later cycle.
  let circleState = $state<(typeof STEPS)[number]['state']>('holdRest');

  const message = $derived(STEPS[stepIndex].message);

  // Hide the global background lines and the actions bar (both rendered by the
  // (app) layout) for the exercise itself (countdown + breathing) and bring
  // them back on the intro/end info screens. The cleanup below restores both
  // if the user navigates away mid-exercise.
  $effect(() => {
    const onInfoScreen = phase === 'intro' || phase === 'end';
    patternBackground.visible = onInfoScreen;
    actionsBar.visible = onInfoScreen;
  });

  // `timer` is the single pending step in the sequential chain; `cyclesDone`
  // counts completed box cycles so the exercise ends after TOTAL_CYCLES.
  let alive = true;
  let timer: ReturnType<typeof setTimeout>;
  let cyclesDone = 0;
  const wait = (ms: number, fn: () => void) => {
    timer = setTimeout(() => alive && fn(), ms);
  };

  // Strict sequence per step: the cue fully swaps → the circle animates to
  // completion → only then the next cue swaps. Changing `stepIndex` swaps the
  // cue as a reveal-out of the old message followed by a reveal-in of the new
  // one;
  function runStep(i: number) {
    stepIndex = i;
    wait(REVEAL_MS, () => {
      circleState = STEPS[i].state;
      wait(STEP_MS, () => {
        const next = i + 1;
        // A full cycle finishes when the last step wraps back to the first.
        if (next >= STEPS.length && ++cyclesDone >= TOTAL_CYCLES) {
          stop();
          return;
        }
        runStep(next % STEPS.length);
      });
    });
  }

  function tickCountdown() {
    if (count > 1) {
      wait(1000, () => {
        count -= 1;
        tickCountdown();
      });
    } else {
      wait(1000, () => {
        phase = 'breathing';
        runStep(0);
      });
    }
  }

  // Start (and re-start) resets to a clean slate, reveals the current info screen
  // out, fades the circle in, then counts down before the breathing loop begins.
  function start() {
    clearTimeout(timer);
    stepIndex = 0;
    cyclesDone = 0;
    circleState = 'holdRest';
    count = COUNT_FROM;
    phase = 'countdown';
    wait(1000, () => {
      tickCountdown();
    });
  }

  // Both the close button and finishing all TOTAL_CYCLES cycles land here.
  function stop() {
    clearTimeout(timer);
    phase = 'end';
  }

  onMount(() => () => {
    alive = false;
    clearTimeout(timer);
    patternBackground.visible = true;
    actionsBar.visible = true;
  });
</script>

<svelte:head>
  <title>breathing — ruakh</title>
</svelte:head>

<!-- Intro and end share a layout — a "breathe" title, a line of copy, and a
     button — differing only in copy and button label. -->
{#snippet infoScreen(copy: string, action: string)}
  <section class="intro">
    <div class="intro-inner" in:reveal|global out:reveal|global>
      <h1 class="intro-title">neshama;</h1>
      <small>noun; from the verb "nasham"</small>
      <p class="intro-copy">{@html copy}</p>
      <button class="intro-start" onclick={start}>{action}</button>
    </div>
  </section>
{/snippet}

<div class="content">
  {#if phase === 'intro'}
    {@render infoScreen(INTRO_COPY, 'start')}
  {:else if phase === 'end'}
    {@render infoScreen(END_COPY, 're-start')}
  {:else}
    <section class="stage" out:reveal|global>
      <div
        class="circleWrap {circleState}"
        style="--cross-dur:{CROSS_MS}ms; --step-dur:{STEP_MS}ms;"
        in:reveal|global
      >
        <svg class="circle" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- The solid fill blob — always present, only ever scales. -->
          <path
            class="fill"
            d="M161.379,46.182C142.809,42.65 111.096,38.622 71.384,83.417C27.743,132.647 63.046,207.141 79.187,226.863C112.494,267.561 188.588,257.044 212.536,243C217.837,239.891 237.801,231.492 245.527,194.891C249.416,176.47 251.792,126.785 231.889,96.048C214.3,68.883 178.103,49.365 161.392,46.185"
          />
          
          <!-- Breathe in target, animates for hold at breathe out state. -->
          <path
            class="in-target"
            pathLength="1"
            d="M161.379,46.182C142.809,42.65 111.096,38.622 71.384,83.417C27.743,132.647 63.046,207.141 79.187,226.863C112.494,267.561 188.588,257.044 212.536,243C217.837,239.891 237.801,231.492 245.527,194.891C249.416,176.47 251.792,126.785 231.889,96.048C214.3,68.883 178.103,49.365 161.392,46.185"
          />

          <!-- Breathe out target, animates for hold at breathe in state. -->
          <path
            class="out-target"
            pathLength="1"
            d="M161.379,46.182C142.809,42.65 111.096,38.622 71.384,83.417C27.743,132.647 63.046,207.141 79.187,226.863C112.494,267.561 188.588,257.044 212.536,243C217.837,239.891 237.801,231.492 245.527,194.891C249.416,176.47 251.792,126.785 231.889,96.048C214.3,68.883 178.103,49.365 161.392,46.185"
          />
        </svg>

        <div class="message" aria-live="polite">
          {#if phase === 'countdown'}
            {#key count}
              <span class="cue" in:fade={{ duration: 400 }} out:fade={{ duration: 400 }}>{count}</span>
            {/key}
          {:else}
            {#key message}
              <span class="cue" in:reveal|global out:reveal|global>{message}</span>
            {/key}
          {/if}
        </div>
      </div>

      <button class="close" onclick={stop} aria-label="stop breathing exercise" in:reveal|global>
        <Icon name="close" size="2.5rem" background="var(--color-accent)" />
      </button>
    </section>
  {/if}
</div>

<style>

  .content {
    /* Fills the layout <main>, which subtracts the header and actions bar. */
    position: relative;
    width: 100%;
    max-width: 34rem;
    margin: 0 auto;
    padding: 2rem;
    flex: 0 0 100%;
    display: flex;
  }

  .intro, .stage {
    flex: 0 0 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .intro-inner {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 32rem;
  }

  .intro-title {
    font-size: var(--text-heading);
    line-height: 1;
  }

  .intro-copy {
    font-size: var(--text-body);
    max-width: 30rem;

    :global p {
      margin-bottom: 1rem;
    }
  }
  .intro-start {
    background: var(--color-ink);
    color: var(--color-bg);
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 2.5rem;
    font: inherit;
    font-size: var(--text-body);
    font-weight: 700;
    cursor: pointer;
  }

  /* This markup arrives via {@html INTRO_COPY}, so the compiler can't stamp it
     with the scope hash. Bound the rules to .intro-copy (a real, scoped element)
     and mark the injected descendants :global so they actually match. */
  .intro-copy :global {
    .breathe-instructions {
      padding-left: 1rem;
      .step {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
      }
    }
    .breathe-instructions .marker {
      display: block;
      background: var(--color-ink);
      font-weight: 700;
      color: var(--color-accent);
      width: 1.5rem;
      height: 1.5rem;
      text-align: center;
      line-height: 1.5rem;
      font-size: 0.8rem;
      border-radius: 999px;
    }
  }

  /* Top-right of the stage; the offsets override the stage's flex-centering. */
  .close {
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    /* margin-top: auto; */
  }

  /* Fixed-size box; a constant scale sets the whole piece's overall size. The
     fill blob (not the wrapper) is what grows and shrinks per phase. */
  .circleWrap {
    width: 100%;
    max-width: 80vh;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto;
  }

  .circle {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    animation: rotate 10s linear infinite;
  }

  /* The fill blob grows toward the in-target (breathe in) and shrinks toward the
     out-target (breathe out); scale is driven per phase by the state class. */
  .circle .fill {
    fill: var(--color-accent);
    stroke: none;
    transform: scale(0.7);
    transform-origin: center;
    transition: transform var(--step-dur) linear;
  }
  .circleWrap.full .fill,
  .circleWrap.holdFull .fill {
    transform: scale(1.005);
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  /* Two fixed-size guide rings the fill grows/shrinks toward. Their dashoffset
     is driven per phase, so each one "strokes" (draws or erases) across the two
     holds — the transition duration is the same --step-dur as the scale. */
  .in-target,
  .out-target {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 2px;
    stroke-linejoin: round;
    stroke-dasharray: 1;
    stroke-opacity: 0;
    transform-origin: center;
    transition: stroke-dashoffset var(--step-dur) linear, stroke-opacity 300ms linear;
  }

  /* Full-size ring, drawn at rest; erases through the breathe-in hold (holdFull)
     and stays erased through breathe out (rest). */
  .in-target {
    transform: scale(1);
    fill: rgba(var(--color-accent-rgb), 0.2);
    stroke-dashoffset: 0;
    stroke-opacity: 1;
  }
  .circleWrap.holdFull .in-target,
  .circleWrap.rest .in-target {
    stroke-dashoffset: 1;
    stroke-opacity: 0;
  }

  /* Rest-size ring, erased at rest; draws through the breathe-in hold (holdFull)
     and stays drawn through breathe out (rest). */
  .out-target {
    transform: scale(0.7);
    stroke: var(--color-bg);
    stroke-dashoffset: 1;
  }
  .circleWrap.holdFull .out-target,
  .circleWrap.rest .out-target {
    stroke-dashoffset: 0;
    stroke-opacity: 1;
  }

  .message {
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    width: 300px;
    height: 10px;
  }

  .cue {
    font-size: 1.5rem;
    text-align: center;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
