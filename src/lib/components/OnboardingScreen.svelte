<script lang="ts">
  import ContentWrapper from '$lib/components/ContentWrapper.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { reveal } from '$lib/transitions';
  import type { ContentBlock } from '$lib/markdown';

  // One-time first-visit screen: the about page's content shown between the
  // intro and the first reflection. Dismissing is the only way forward — the
  // home page persists the `onboarding` flag and reveals the reflection.
  let { blocks, ondismiss }: { blocks: ContentBlock[]; ondismiss: () => void } = $props();
</script>

<ContentWrapper>
  <div class="onboarding" in:reveal|global out:reveal|global>
    <PageContent {blocks} />
    <button class="button" onclick={ondismiss}>continue</button>
  </div>
</ContentWrapper>

<style>
  .onboarding {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding-bottom: var(--app-gutter);
  }
</style>
