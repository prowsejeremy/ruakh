<script lang="ts">
  import { reveal } from "$lib/transitions";

  let { children, scrollable=true } = $props();
</script>

<section class="playground content {scrollable ? 'scrollable' : ''}" out:reveal|global>
  {@render children()}
</section>

<style>
  .content {
    height: 100%;
    margin: 0 auto var(--app-gutter);
    padding-top: var(--app-gutter);
    flex: 1 0 100%;
  }
  
  /* Playground is a global class found in app.css */

  /* Scrollable is a global class found in app.css */
</style>