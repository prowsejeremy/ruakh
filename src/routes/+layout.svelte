<script lang="ts">
  import '$lib/styles/fonts.css';
  import '$lib/styles/app.css';
  import '$lib/styles/panel.css';
  import '$lib/client/install.svelte'; // early beforeinstallprompt capture
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import PatternBackground from '$lib/components/PatternBackground.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { loadTheme, applyTheme } from '$lib/client/theme';
  import { intro } from '$lib/client/intro.svelte';

  let { children } = $props();

  // Re-apply the saved theme snapshot on mount (belt-and-braces with the
  // pre-paint script in app.html). Admin theme edits reach a device only when
  // the user re-picks — the snapshot holds the colors chosen at pick time.
  onMount(() => applyTheme(loadTheme()));
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <!-- Preload the two faces used at first paint (wordmark + reflection body); crossorigin is required for font preloads. -->
  <link rel="preload" href="/fonts/PT-Serif/PTSerifBold.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="/fonts/PT-Serif/PTSerif.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<!-- zIndex -1: a fixed layer at z-index 0 would paint over in-flow content. -->
<PatternBackground routeKey={page.url.pathname} zIndex={-1} />
<header class="app-header">
  <!-- On `/` the wordmark waits for the intro so the intro's h1 can morph
       (out:send → in:receive) into this slot; everywhere else it renders
       immediately, SSR included. Once mounted it survives client-side
       navigation, so the morph never replays. -->
  {#if intro.done || page.url.pathname !== '/'}
    <a href="/">
      <Logo size={'5rem'} />
    </a>
  {/if}
</header>
{@render children()}

<style>
  /* Fixed-height slot so the page doesn't shift when the wordmark mounts
     after the intro. Screens that must fit the viewport subtract
     --app-header-height (app.css) from 100dvh. */
  .app-header {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--app-header-height);
  }
</style>
