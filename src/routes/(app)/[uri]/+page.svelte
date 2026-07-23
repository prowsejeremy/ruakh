<script lang="ts">
  import ContentWrapper from '$lib/components/ContentWrapper.svelte';
  import { blocksToHtml } from '$lib/markdown';
  import { reveal } from '$lib/transitions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.uri} — ruakh</title>
</svelte:head>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- text is escaped in blocksToHtml -->
<ContentWrapper>
  <div class="page" in:reveal|global out:reveal|global>
    {@html blocksToHtml(data.blocks)}
  </div>
</ContentWrapper>

<style>
  .page {
    width: 100%;
    /* Content is injected via {@html}, so these selectors must be :global —
       Svelte does not scope styles onto @html output. */
    :global(h1) {
      font-size: var(--text-heading);
      line-height: 1;
      margin-bottom: 2rem;
    }
    :global(h2) {
      font-size: var(--text-sub-heading);
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    :global(p) {
      white-space: pre-line;
    }
    :global(p:not(:last-child)) {
      margin-bottom: 1rem;
    }
    :global(small:not(:last-child)) {
      margin-bottom: 1rem;
    }
  }
</style>
