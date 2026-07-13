<script lang="ts">
  let { children } = $props();
</script>

<div class="prefs">
  {@render children()}
</div>

<style>
  /* Unlike admin, preferences carries no color-var overrides — it renders in
     whatever theme is active, transparent over the global PatternBackground
     (a `position: fixed` layer at z-index -1 set in the root layout). The
     wordmark header lives in the root layout, hence the subtraction. */
  .prefs {
    min-height: calc(100vh - var(--app-header-height));
    min-height: calc(100dvh - var(--app-header-height));
  }
</style>
