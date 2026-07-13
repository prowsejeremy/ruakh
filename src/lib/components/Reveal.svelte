<script lang="ts">
  import type { Snippet } from 'svelte';
  import { reveal, type RevealParams } from '$lib/transitions';

  let {
    children,
    enter = true,
    exit = true,
    ...params
  }: Omit<RevealParams, 'enabled'> & {
    children: Snippet;
    /** Animate when the element enters the page. */
    enter?: boolean;
    /** Animate when the element leaves the page. Leave off for in-flow
     * content whose delayed unmount would hold up a page swap. */
    exit?: boolean;
  } = $props();
</script>

<!-- Global: screens are swapped by ancestor blocks (page navigation, the
     intro {#if}), and the wrapped content should animate through those too. -->
<div
  class="reveal"
  in:reveal|global={{ ...params, enabled: enter }}
  out:reveal|global={{ ...params, enabled: exit }}
>
  {@render children()}
</div>
