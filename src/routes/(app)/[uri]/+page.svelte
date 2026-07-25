<script lang="ts">
  import ContentWrapper from '$lib/components/ContentWrapper.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import { reveal } from '$lib/transitions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.title || data.uri} — ruakh</title>
</svelte:head>

<ContentWrapper>
  <div class="page-wrap" in:reveal|global out:reveal|global>
    <PageContent blocks={data.blocks} />
  </div>
</ContentWrapper>

<style>
  .page-wrap {
    width: 100%;
  }
</style>
