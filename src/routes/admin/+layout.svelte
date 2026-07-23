<script lang="ts">
  import { applyTheme } from '$lib/client/theme';
  import ContentWrapper from '$lib/components/ContentWrapper.svelte';
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
  <ContentWrapper>
    {@render children()}
  </ContentWrapper>
</main>

<style>
  /* The fixed dark palette is applied above; the PatternBackground never
     renders here (it belongs to the (app) group's layout), so the base theme
     paints a flat dark background. This wrapper just reserves the viewport
     height and scopes the admin-only "+" button. */
  main.admin {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: calc(100vh - var(--app-header-height));
    height: calc(100dvh - var(--app-header-height));
  }
</style>
