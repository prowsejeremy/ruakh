<script lang="ts">
  import '$lib/styles/fonts.css';
  import '$lib/styles/app.css';
  import '$lib/styles/panel.css';
  import '$lib/client/install.svelte'; // early beforeinstallprompt capture
  import { page } from '$app/state';
  import Logo from '$lib/components/Logo.svelte';
  import { intro } from '$lib/client/intro.svelte';
  import { reveal } from '$lib/transitions';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={'/app-icons/ruakh.svg'} />
  <!-- Preload the two faces used at first paint (wordmark + reflection body); crossorigin is required for font preloads. -->
  <link rel="preload" href="/fonts/PT-Serif/PTSerifBold.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="/fonts/PT-Serif/PTSerif.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<!-- Only the chrome shared by every section lives here: global styles, head
     tags, and the wordmark header. The visitor chrome (PatternBackground,
     <main>, Actions, saved theme) is the (app) group's layout; the admin
     chrome and its fixed dark palette live under /admin. -->
<header class="app-header">
  <!-- On `/` the wordmark waits for the intro so the intro's h1 can morph
       (out:send → in:receive) into this slot; everywhere else it renders
       immediately, SSR included. Once mounted it survives client-side
       navigation, so the morph never replays. -->
  {#if intro.done || page.url.pathname !== '/'}
    <a href="/" in:reveal>
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
