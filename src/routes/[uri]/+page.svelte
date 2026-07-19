<script lang="ts">
  import Actions from '$lib/components/Actions.svelte';
  import { blocksToHtml } from '$lib/markdown';
  import { reveal } from '$lib/transitions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.uri} — ruakh</title>
</svelte:head>

<main>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- text is escaped in blocksToHtml -->
  <section class="content" in:reveal|global out:reveal|global>
    {@html blocksToHtml(data.blocks)}
  </section>

  <Actions />
</main>

<style>
  main {
    /* The global wordmark header (root layout) sits above; fill the rest. */
    min-height: calc(100vh - var(--app-header-height));
    min-height: calc(100dvh - var(--app-header-height));
    max-width: 34rem;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;

    /* Content is injected via {@html}, so these selectors must be :global —
       Svelte does not scope styles onto @html output. */
    :global(h1) {
      font-size: var(--text-sub-heading);
      line-height: 1;
      padding-top: 1rem;
      margin-bottom: 2rem;
    }
    :global(h2) {
      font-size: 1.3rem;
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
