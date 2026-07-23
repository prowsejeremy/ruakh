<script lang="ts">
  import { page } from '$app/state';
  import { reveal } from '$lib/transitions';
  import { applyTheme, loadTheme } from '$lib/client/theme';

  // Re-apply the visitor's saved theme on mount, in case the pre-paint script
  // painted a different palette before routing resolved.
  $effect(() => {
    applyTheme(loadTheme());
  });
</script>

<svelte:head>
  <title>{page.status === 404 ? 'Not found' : 'Error'} — ruakh</title>
</svelte:head>

<!-- The single error boundary for the whole app, rendered inside the root
     layout only (wordmark header, flat themed background). src/error.html
     mirrors this design for errors thrown before routing — keep in sync. -->
<main class="error" in:reveal|global>
  <h1>{page.status}</h1>
  <p>
    {page.status === 404
      ? "This page doesn't exist — it may have been moved or removed."
      : page.error?.message || 'Something went wrong.'}
  </p>
  <a href="/">Back to today's reflection</a>
</main>

<style>
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1rem;
    height: calc(100vh - var(--app-header-height));
    height: calc(100dvh - var(--app-header-height));
    padding-inline: var(--app-gutter);
  }

  h1 {
    font-size: var(--text-heading);
    line-height: 1;
  }

  a {
    color: inherit;
  }
</style>
