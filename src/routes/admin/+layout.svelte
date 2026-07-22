<script lang="ts">
  import { applyTheme } from '$lib/client/theme';
  import { ADMIN_THEME } from '$lib/themes';

  let { children } = $props();

  // The /admin area uses a fixed dark palette instead of the visitor's theme.
  // Applying it to the *base* theme (document root) — rather than scoping an
  // override to this wrapper — means the whole chrome (body, wordmark header)
  // follows it; app.html's pre-paint script mirrors this so a hard admin load
  // doesn't flash the public theme first. Runs on mount, i.e. on every
  // navigation into admin; the (app) group's layout restores the saved theme
  // on the way out.
  $effect(() => {
    applyTheme(ADMIN_THEME);
  });
</script>

<main class="admin">
  {@render children()}
</main>

<style>
  /* The fixed dark palette is applied above; the PatternBackground never
     renders here (it belongs to the (app) group's layout), so the base theme
     paints a flat dark background. This wrapper just reserves the viewport
     height and scopes the admin-only "+" button. */
  .admin {
    /* The global wordmark header (root layout) sits above this wrapper. */
    height: calc(100vh - var(--app-header-height));
    height: calc(100dvh - var(--app-header-height));
    max-width: 34rem;
    padding: 0 var(--app-gutter) var(--app-gutter);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--app-gutter);
  }
</style>
