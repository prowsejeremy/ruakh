<script lang="ts">
  let { children } = $props();
</script>

<div class="admin">
  {@render children()}
</div>

<style>
  /* The admin area's fixed dark palette is applied to the *base* theme by the
     root layout while an /admin route is active (see src/routes/+layout.svelte
     and the pre-paint script in src/app.html), so the body and wordmark header
     follow it and the PatternBackground isn't rendered. This wrapper just
     reserves the viewport height and scopes the admin-only "+" button. */
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
