<script lang="ts">
  import { blocksToHtml } from '$lib/markdown';
  import type { ContentBlock } from '$lib/markdown';

  // Shared renderer + typography for DB-backed markdown page content — the one
  // place the "page" styles live. Used by the /[uri] route and the onboarding
  // screen. Transitions stay with the callers (Svelte can't put `transition:`
  // on a component), so wrap this in an element to animate it.
  let { blocks }: { blocks: ContentBlock[] } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- text is escaped in blocksToHtml -->
<div class="page">
  {@html blocksToHtml(blocks)}
</div>

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
