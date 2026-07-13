<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  import { reveal } from '$lib/transitions';
  import { formatAttribution } from '$lib/format';
  import { blocksToHtml } from '$lib/markdown';
  import Actions from '$lib/components/Actions.svelte';
  import type { ReflectionView } from '$lib/types';

  let { reflection, fromIntro = false }: { reflection: ReflectionView | null; fromIntro?: boolean } =
    $props();

  // The entrance treatment applies only to the content present when the intro
  // lands; the first slide or reflection change turns it off (see show() and
  // the reset effect) so later first-viewed parts don't inherit the delay.
  // svelte-ignore state_referenced_locally -- the initial value is exactly what we want
  let introEntrance = $state(fromIntro);

  const credit = $derived(reflection ? formatAttribution(reflection.attribution, reflection.source) : null);

  let active = $state(0);

  const fadeMs = () =>
    browser && matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300;

  function show(i: number) {
    if (!reflection || i === active || i < 0 || i >= reflection.body.length) return;
    introEntrance = false;
    active = i;
  }

  let downX: number | null = null;
  let downY = 0;
  function onPointerDown(e: PointerEvent) {
    downX = e.clientX;
    downY = e.clientY;
  }
  function onPointerUp(e: PointerEvent) {
    if (downX === null) return;
    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    downX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(active + (dx < 0 ? 1 : -1));
  }
  function onPointerCancel() {
    downX = null;
  }

  // A different reflection (offline fallback, navigation) starts fresh.
  // svelte-ignore state_referenced_locally -- seed with the mount-time id on purpose
  let lastId = reflection?.id;
  $effect(() => {
    if (reflection?.id !== lastId) introEntrance = false;
    lastId = reflection?.id;
    active = 0;
  });

</script>

<!-- The wordmark header lives in the root layout, which also hosts the intro
     morph's receive target. -->
<!-- The screen enters as one unit (reveal). No exit reveal: a global outro on
     in-flow content would hold the outgoing page alive during navigation. -->
<section class:intro-entrance={introEntrance}>
  {#if reflection}
    <!-- Only the active part is rendered; the key makes part changes (and new
         reflections) crossfade between the outgoing and incoming slide. -->
    <!-- Swipe is a convenience duplicate of the dot buttons, so the wrapper
         is not exposed as interactive. -->
    <div
      class="slider"
      role="presentation"
      onpointerdown={onPointerDown}
      onpointerup={onPointerUp}
      onpointercancel={onPointerCancel}
      in:reveal|global
    >
      {#key `${reflection.id}:${active}`}
        <blockquote class="slide" transition:fade={{ duration: fadeMs() }}>
          <div class="reflection-content">
          <!-- `?? []` guards the render between a reflection change and the effect
               resetting `active` (a shorter body could be indexed past its end).
               Headings are demoted one level (the wordmark is the page heading). -->
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- text is escaped in blocksToHtml -->
          {@html blocksToHtml(reflection.body[active] ?? [], { headingOffset: 1, blockClass: 'block' })}
          </div>
        </blockquote>
      {/key}
    </div>
    {#if reflection.body.length > 1}
      <div class="dots" role="group" aria-label="reflection parts" in:reveal|global>
        {#each reflection.body as _, i (i)}
          <button
            type="button"
            class="dot"
            class:active={active === i}
            aria-label={`part ${i + 1} of ${reflection.body.length}`}
            aria-current={active === i}
            onclick={() => show(i)}
          ></button>
        {/each}
      </div>
    {/if}
    {#if credit}
      <small class="credit" in:reveal|global>{credit}</small>
    {/if}
    <!-- Wrapper carries the intro-entrance fade; Actions itself stays free of
      intro coupling so it drops cleanly into other screens. -->
    <Actions save={reflection} preferences exitRoute={page.url.pathname} />
  {:else}
    <p class="empty" in:reveal|global>No reflection is available yet.</p>
  {/if}
</section>

<style>
  section {
    /* The global wordmark header (root layout) sits above; fill the rest. */
    height: calc(100vh - var(--app-header-height));
    height: calc(100dvh - var(--app-header-height));
    display: flex;
    flex-direction: column;
    padding: 2rem;
    max-width: 34rem;
    margin: 0 auto;
  }
  .slider {
    flex: 1;
    min-height: 0;
    position: relative; /* crossfading slides stack absolutely inside */
    touch-action: pan-y; /* vertical scroll stays native; horizontal swipes reach us */
  }
  .slide {
    position: absolute;
    inset: 0;
    display: flex;
    overflow-y: auto; /* a long part scrolls vertically inside its slide */
  }
  /* Blocks are injected via {@html}, so these selectors must be :global —
     Svelte does not scope styles onto @html output. */
  .slide :global(.block) {
    white-space: pre-line; /* honors single line breaks inside a paragraph */
    display: block;
  }
  .slide :global(.block + .block) {
    margin-top: 1rem;
  }
  .slide :global(h2) {
    font-size: 1.5rem;
  }
  .slide :global(h3) {
    font-size: inherit;
    font-weight: 700;
  }

  @keyframes block-fade-in {
    from {
      opacity: 0;
      visibility: hidden;
    }
    to {
      opacity: 1;
      visibility: visible;
    }
  }

  .reflection-content {
    width: 100%;
    line-height: 1.9;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: auto 0;
  }

  .reflection-content :global(p) {
    font-size: var(--text-large);
  }

  /* Entering from the intro: content waits for the wordmark morph (600ms) to land. */
  .intro-entrance .dots,
  .intro-entrance .credit,
  .intro-entrance .empty {
    animation: block-fade-in 0.6s ease-out 600ms both;
  }
  @media (prefers-reduced-motion: reduce) {
    .intro-entrance .dots,
    .intro-entrance .credit,
    .intro-entrance .empty {
      animation-duration: 0s;
      animation-delay: 0s;
    }
  }
  .dots {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    padding-block: 0.5rem;
  }
  .dot {
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
  }
  .dot::before {
    content: '';
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    border: 1px solid currentColor;
  }
  .dot.active::before {
    background: currentColor;
  }
  .credit {
    text-align: right;
    font-weight: 700;
    padding-block: 2rem 1rem;
  }
  .empty {
    flex: 1;
    display: grid;
    place-items: center;
  }
</style>
