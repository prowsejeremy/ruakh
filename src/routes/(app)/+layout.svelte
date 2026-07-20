<script lang="ts">
  import { page } from '$app/state';
  import PatternBackground from '$lib/components/PatternBackground.svelte';
  import Actions from '$lib/components/Actions.svelte';
  import { loadTheme, applyTheme } from '$lib/client/theme';
  import { intro } from '$lib/client/intro.svelte';
  import { actionsBar } from '$lib/client/actions-bar.svelte';

  let { children } = $props();

  // Re-applies the saved theme snapshot on mount (belt-and-braces with
  // app.html's pre-paint script) and whenever the visitor returns from admin —
  // leaving /admin unmounts that layout and remounts this one.
  $effect(() => {
    applyTheme(loadTheme());
  });
</script>

<!-- zIndex -1: a fixed layer at z-index 0 would paint over in-flow content. -->
<!-- On `/` the lines stay hidden until the intro finishes (intro.done),
     so they draw in just after the reflection; everywhere else they show
     immediately. Static once generated — no per-route rotation. -->
<PatternBackground zIndex={-1} revealLines={intro.done || page.url.pathname !== '/'} />

<!-- With the bar hidden its height is zeroed too, so main reclaims the row;
     the height transition matches the pattern lines' cross-fade. -->
<main style:--app-actions-height={actionsBar.visible ? undefined : '0rem'}>
  {@render children()}
</main>

<!-- actionsBar.visible lets a screen hide the bar without leaving the group —
     the breathing exercise drops it (with the pattern lines) for its duration. -->
{#if actionsBar.visible && (intro.done || page.url.pathname !== '/')}
  <!-- save comes from actionsBar (published by ReflectionScreen), not page
       data — home can override a stale SSR pick client-side. -->
  <Actions save={actionsBar.reflection} />
{/if}

<style>
  /* The visitor chrome stacks header + main + actions; main takes whatever the
     two fixed-height bars leave, and pages fill it with flex: 1. */
  main {
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--app-header-height) - var(--app-actions-height));
    height: calc(100dvh - var(--app-header-height) - var(--app-actions-height));
    overflow: scroll;
    transition: height 600ms var(--transition-timing) 300ms; /* matches .lines in PatternBackground */
  }
</style>
