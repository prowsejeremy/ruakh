<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function preview(content: string): string {
    return content.length > 90 ? content.slice(0, 90) + '…' : content;
  }
</script>

<svelte:head>
  <title>pages — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">pages</h1>
  </header>

  <div class="panel-list">
    {#each data.pages as p (p.uri)}
      <a class="panel-card" href="/admin/pages/{p.uri}">
        <div class="panel-card-title">/{p.uri}</div>
        <div class="panel-card-meta">{preview(p.content)}</div>
      </a>
    {:else}
      <p class="panel-blurb">No pages found.</p>
    {/each}
  </div>

  <a class="admin-fab" href="/admin/pages/new" aria-label="New page"><Icon name="add" background="#101010" size="100%" /></a>
</main>
