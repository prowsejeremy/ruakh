<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import Icon from '$lib/components/Icon.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import { reveal } from '$lib/transitions';

  let { children } = $props();

  // One source of truth for every sub-page's visible title and document title.
  // Keyed by pathname (no trailing slash). New sub-routes add one line here.
  const TITLES: Record<string, string> = {
    '/preferences': 'preferences',
    '/preferences/theme': 'theme',
    '/preferences/saved': 'saved reflections',
    '/preferences/history': 'past reflections',
    '/preferences/device': 'your device'
  };

  let path = $derived(page.url.pathname.replace(/\/$/, '') || '/');
  let isIndex = $derived(path === '/preferences');
  let title = $derived(TITLES[path] ?? 'preferences');

  // The launching page threads its return target via the `exit` query param
  // (see Actions.svelte); the close button (index only) sends the visitor back
  // there. Capture it once at mount — before stripping the URL — so it survives
  // sub-navigation (this layout persists) and the address-bar cleanup. Absent
  // the param, close falls back to the homepage.
  let exitRoute = $state('/');
  onMount(() => {
    const exit = page.url.searchParams.get('exit');
    if (exit) exitRoute = exit;
    // Strip `exit` without a navigation or history entry.
    if (page.url.searchParams.has('exit')) replaceState(page.url.pathname, page.state);
  });
</script>

<svelte:head>
  <title>{isIndex ? title : `${title} — preferences`} — ruakh</title>
</svelte:head>

<!-- Unlike admin, preferences carries no color-var overrides — it renders in
     whatever theme is active, transparent over the global PatternBackground
     (a `position: fixed` layer at z-index -1 set in the root layout). The
     wordmark header lives in the root layout, hence the min-height subtraction.

     The frame — panel-main wrapper + header — lives here, not in each page, so
     there is only ever a single persistent instance: it cannot stack behind an
     outgoing page during a swap. Only {@render children()} (the page body) is
     swapped on sub-navigation, so the header's in/out reveal fires just once,
     when the whole preferences section is entered or closed. -->
<div class="prefs">
  <main class="panel-main">
    <header class="panel-header" in:reveal|global out:reveal|global>
      {#if isIndex}
        <h1 class="panel-title">{title}</h1>
        <a class="panel-close" href={exitRoute} aria-label="close preferences">
          <Icon name="close" background="var(--color-accent)" size="100%" />
        </a>
      {:else}
        <BackButton background="var(--color-accent)" />
        <h1 class="panel-title">{title}</h1>
      {/if}
    </header>

    {@render children()}
  </main>
</div>

<style>
  .prefs {
    min-height: calc(100vh - var(--app-header-height));
    min-height: calc(100dvh - var(--app-header-height));
  }
</style>
