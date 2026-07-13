<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import Icon from '$lib/components/Icon.svelte';
  import { reveal } from '$lib/transitions';

  // The launching page threads its return target via the `exit` query param
  // (see Actions.svelte). Capture it once at load — before stripping the URL —
  // so the close button keeps it even after we clean the param away. Absent
  // that param, close falls back to the homepage.
  // svelte-ignore state_referenced_locally -- one-time capture, intentionally not reactive
  const exitRoute = page.url.searchParams.get('exit') ?? '/';

  // Strip `exit` from the address bar without a navigation or history entry.
  onMount(() => {
    if (page.url.searchParams.has('exit')) replaceState(page.url.pathname, page.state);
  });
</script>

<svelte:head>
  <title>preferences — ruakh</title>
</svelte:head>

<main class="panel-main">
  <!-- All reveals mount in one tick, so the batch orders itself top to
       bottom: header first, then each menu button in turn. -->
  <header class="panel-header" in:reveal|global>
    <h1 class="panel-title">preferences</h1>
    <a class="panel-close" href={exitRoute} aria-label="close preferences">
      <Icon name="close" background="var(--color-accent)" size="100%" />
    </a>
  </header>

  <nav class="menu">
    <a class="panel-menu-btn" in:reveal|global href="/preferences/theme">Theme <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" in:reveal|global href="/preferences/saved">Saved reflections <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" in:reveal|global href="/preferences/history">Past reflections <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" in:reveal|global href="/preferences/device">Your device <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" in:reveal|global href="/about">About <Icon name="forward" size="1.9rem" /></a>
  </nav>
</main>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
