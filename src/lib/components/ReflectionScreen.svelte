<script lang="ts">
  import { fade } from 'svelte/transition';
  import { reveal } from '$lib/transitions';
  import { swipeStep } from '$lib/swipe';
  import { actionsBar } from '$lib/client/actions-bar.svelte';
  import { formatAttribution } from '$lib/format';
  import { blocksToHtml } from '$lib/markdown';
  import type { ReflectionView } from '$lib/types';

  let { reflection, fromIntro = false }: { reflection: ReflectionView | null; fromIntro?: boolean } =
    $props();

  // The entrance treatment applies only to the content present when the intro
  // lands; the first slide or reflection change turns it off (see show() and
  // the reset effect) so later first-viewed parts don't inherit the delay.
  // svelte-ignore state_referenced_locally -- the initial value is exactly what we want
  let introEntrance = $state(fromIntro);
  let attribution = $state<'author' | 'copyright' | null>('author');

  const credit = $derived(reflection ? formatAttribution(reflection.attribution, reflection.source) : null);
  const copyright = $derived(reflection ? reflection.copyright : null);

  let active = $state(0);

  const fadeMs = () => 300;

  function show(i: number) {
    if (!reflection || i === active || i < 0 || i >= reflection.body.length) return;
    introEntrance = false;
    active = i;
  }

  // Swipe is committed on pointerup with the whole gesture (distance + duration),
  // so a slow drag — a lingering press or text selection — never flips slides.
  // pointercancel is the Android fallback: Chrome can end the touch pointer
  // stream (handing the gesture to the scroll compositor) before a usable
  // pointerup arrives, so it re-runs the same check against the last pointermove
  // position. Vertical-dominant gestures fall through to native `pan-y` scroll.
  let downX: number | null = null;
  let downY = 0;
  let downT = 0;
  let lastX = 0;
  let lastY = 0;
  function onPointerDown(e: PointerEvent) {
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    downT = e.timeStamp;
  }
  function onPointerMove(e: PointerEvent) {
    if (downX === null) return;
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function commitSwipe(x: number, y: number, t: number) {
    if (downX === null) return;
    const step = swipeStep(x - downX, y - downY, t - downT);
    downX = null;
    if (step !== 0) show(active + step);
  }
  function onPointerUp(e: PointerEvent) {
    commitSwipe(e.clientX, e.clientY, e.timeStamp);
  }
  function onPointerCancel(e: PointerEvent) {
    commitSwipe(lastX, lastY, e.timeStamp);
  }

  // Publish the shown reflection to the layout-owned Actions bar so its save
  // button targets what's actually on screen (tracks the home page's offline
  // override, not just load data). The effect only reads `reflection` (the
  // prop) and writes the store — it never reads the store back, so it can't
  // depend on what it writes and won't loop.
  //
  // Cleared on unmount, but guarded: with `out:reveal|global` the outgoing
  // screen tears down *after* the incoming one has published, so an
  // unconditional clear would wipe the new reflection. Comparing ids (captured
  // from the prop, matched in the untracked teardown) clears only our own
  // entry, leaving a newer reflection in place.
  $effect(() => {
    actionsBar.reflection = reflection;
    const publishedId = reflection?.id ?? null;
    return () => {
      if (actionsBar.reflection?.id === publishedId) actionsBar.reflection = null;
    };
  });

  // A different reflection (offline fallback, navigation) starts fresh.
  // svelte-ignore state_referenced_locally -- seed with the mount-time id on purpose
  let lastId = reflection?.id;
  $effect(() => {
    if (reflection?.id !== lastId) introEntrance = false;
    lastId = reflection?.id;
    active = 0;
  });

  function toggleAttribution() {
    if (!reflection || !copyright) return;
    if (attribution === 'author') attribution = 'copyright';
    else attribution = 'author';
  }

</script>

<!-- The wordmark header lives in the root layout, which also hosts the intro
     morph's receive target. -->
<!-- Reveals are |global: a page swap destroys/creates this screen from far
     above the local {#if} blocks, and local transitions are skipped on
     ancestor changes. The (app) layout's persistent frame plus the reveal
     handoff (see transitions.ts) cover the in/out overlap during navigation. -->
<section class:intro-entrance={introEntrance} out:reveal|global>
  {#if reflection}
    <!-- Only the active part is rendered; the key makes part changes (and new
         reflections) crossfade between the outgoing and incoming slide. -->
    <!-- Swipe is a convenience duplicate of the dot buttons, so the wrapper
         is not exposed as interactive. -->
    <div
      class="slider"
      role="presentation"
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
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
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="attribution" onclick={toggleAttribution} in:reveal|global>
        {#if attribution == 'author'}
          <small class="author" in:reveal={{y: 10}} out:fade>{credit}</small>
        {:else if copyright && attribution == 'copyright'}
          <small class="copyright" in:reveal={{ endOpacity: 0.5, y: 10 }} out:fade>{copyright}</small>
        {/if}
      </div>
    {/if}
  {:else}
    <p class="empty" in:reveal|global>No reflection is available yet.</p>
  {/if}
</section>

<style>
  section {
    /* Fills the layout <main> (which already subtracts the header and actions
       bar); slides are absolutely positioned, so long parts scroll internally
       instead of growing the page. Pinned to main's full height (not flex: 1):
       during a page swap the incoming page briefly shares the flex container,
       and a shrinkable section would collapse mid-outro, clipping the slide. */
    flex: 0 0 100%;
    display: flex;
    flex-direction: column;
    
    gap: 1rem;
    width: 100%;
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
    /* a long part scrolls vertically inside its slide */
    overflow: hidden;
    overflow-y: auto;

    /* Blocks are injected via {@html}, so these selectors must be :global —
       Svelte does not scope styles onto @html output. */
    :global(.block) {
      white-space: pre-line; /* honors single line breaks inside a paragraph */
      display: block;
    }
    :global(.block + .block) {
      margin-top: 1rem;
    }
    :global(h2) {
      font-size: 1.5rem;
    }
    :global(h3) {
      font-size: inherit;
      font-weight: 700;
    }
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

    /* :global — the paragraph is {@html} output (see .slide above). */
    :global(p) {
      font-size: var(--text-large);
    }
  }

  /* Entering from the intro: content waits for the wordmark morph (600ms) to land. */
  .intro-entrance {
    .dots,
    .author,
    .copyright,
    .empty {
      animation: block-fade-in 0.6s ease-out 600ms both;
    }
  }
  .dots {
    display: flex;
    justify-content: flex-end;
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

    &::before {
      content: '';
      width: 1rem;
      height: 0.1rem;
      /* border-radius: 999px; */
      /* border: 1px solid currentColor; */
      background: currentColor;
      opacity: 0.2;
    }
    &.active::before {
      /* background: currentColor; */
      opacity: 0.7;
    }
  }
  .attribution {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: right;
    position: relative;
    width: 100%;
    height: 3rem;
    cursor: pointer;
  }
  .author {
    font-weight: 700;
    position: absolute;
    right: 0;
  }
  .copyright {
    font-size: 0.8rem;
    position: absolute;
    opacity: 0.5;
    right: 0;
  }
  .empty {
    flex: 1;
    display: grid;
    place-items: center;
  }
</style>
