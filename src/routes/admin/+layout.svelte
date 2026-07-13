<script lang="ts">
  let { children } = $props();
</script>

<div class="admin">
  {@render children()}
</div>

<style>
  /* Fixed dark palette for the whole admin area, regardless of the public
     theme — scoped locally so it never leaks into the public app. This
     wrapper is opaque and covers the full viewport, which is enough to hide
     the global PatternBackground (a `position: fixed` layer at z-index -1). */
  .admin {
    --color-bg: #1f1f1f;
    --color-accent: #292929;
    --color-ink: #ffffff;
    --color-ink-rgb: 255, 255, 255;

    background: var(--color-bg);
    color: var(--color-ink);
    /* The global wordmark header (root layout) sits above this wrapper. */
    min-height: calc(100vh - var(--app-header-height));
    min-height: calc(100dvh - var(--app-header-height));
  }

  /* Paint the page itself dark while any admin screen is mounted — prevents
     the public theme's background bleeding into overscroll/odd viewports,
     and colors the root layout's wordmark header, which sits outside this
     wrapper and would otherwise render near-black on near-black. */
  :global(body:has(.admin)) {
    background: #1f1f1f;
    color: #ffffff;
  }

  /* Opaque so the public theme's PatternBackground (fixed, z-index -1, above
     the body background) can't show through the header strip in admin. */
  :global(body:has(.admin) .app-header) {
    background: #1f1f1f;
  }

  /* Admin-only floating "+" create button. Structural list/card/field/etc.
     styles now live in the shared, theme-agnostic src/lib/styles/panel.css
     (imported globally from the root layout) as .panel-* classes. */
  :global(.admin .admin-fab) {
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
</style>
