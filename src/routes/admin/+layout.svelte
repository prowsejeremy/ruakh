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

<div class="admin">
  {@render children()}
</div>

<style>
  /* The fixed dark palette is applied above; the PatternBackground never
     renders here (it belongs to the (app) group's layout), so the base theme
     paints a flat dark background. This wrapper just reserves the viewport
     height and scopes the admin-only "+" button. */
  .admin {
    /* The global wordmark header (root layout) sits above this wrapper. */
    min-height: calc(100vh - var(--app-header-height));
    min-height: calc(100dvh - var(--app-header-height));

    /* Admin-only floating "+" create button. It's rendered by child route
       pages, so :global is necessary to reach it — but scoped under this
       component's own .admin rather than fully global. Structural
       list/card/field/etc. styles live in the shared, theme-agnostic
       src/lib/styles/panel.css (imported globally from the root layout) as
       .panel-* classes. */
    :global(.admin-fab) {
      position: fixed;
      left: 50%;
      bottom: 2rem;
      transform: translateX(-50%);
      width: 3.25rem;
      height: 3.25rem;
      color: var(--color-ink);
      font-size: 1.75rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }
  }
</style>
