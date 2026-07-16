<script lang="ts">
  import '$lib/styles/fonts.css';
  import '$lib/styles/app.css';
  import '$lib/styles/panel.css';
  import '$lib/client/install.svelte'; // early beforeinstallprompt capture
  import { page } from '$app/state';
  import PatternBackground from '$lib/components/PatternBackground.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { loadTheme, applyTheme } from '$lib/client/theme';
  import { ADMIN_THEME } from '$lib/themes';
  import { intro } from '$lib/client/intro.svelte';
  import {reveal} from '$lib/transitions';

  let { children } = $props();

  // The /admin area uses a fixed dark palette instead of the visitor's theme.
  // Applying it to the *base* theme (document root) — rather than scoping an
  // override to the admin wrapper — means the whole chrome (body, wordmark
  // header) follows it; app.html's pre-paint script mirrors this so a hard
  // admin load doesn't flash the public theme first.
  let isAdmin = $derived(page.url.pathname.startsWith('/admin'));

  // Runs on mount and on every navigation into/out of admin. For the public
  // theme this re-applies the saved snapshot (belt-and-braces with app.html);
  // admin theme edits reach a device only when the user re-picks — the snapshot
  // holds the colors chosen at pick time.
  $effect(() => {
    applyTheme(isAdmin ? ADMIN_THEME : loadTheme());
  });
</script>

<svelte:head>
  <link rel="icon" href={'/app-icons/ruakh.svg'} />
  <!-- Preload the two faces used at first paint (wordmark + reflection body); crossorigin is required for font preloads. -->
  <link rel="preload" href="/fonts/PT-Serif/PTSerifBold.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href="/fonts/PT-Serif/PTSerif.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<!-- zIndex -1: a fixed layer at z-index 0 would paint over in-flow content.
     Not rendered on admin: the base theme paints a flat dark background there. -->
{#if !isAdmin}
  <!-- On `/` the lines stay hidden until the intro finishes (intro.done),
       so they draw in just after the reflection; everywhere else they show
       immediately. Static once generated — no per-route rotation. -->
  <PatternBackground zIndex={-1} revealLines={intro.done || page.url.pathname !== '/'} />
{/if}
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
