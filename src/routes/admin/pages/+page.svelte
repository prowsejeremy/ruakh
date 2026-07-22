<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import type { PageData } from './$types';
  import AdminAddButton from '$lib/components/admin/AdminAddButton.svelte';
  let { data }: { data: PageData } = $props();

  function preview(content: string): string {
    return content.length > 90 ? content.slice(0, 90) + '…' : content;
  }
</script>

<svelte:head>
  <title>pages — admin — ruakh</title>
</svelte:head>

<section class="panel-main">
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
</section>
<AdminAddButton href="/admin/pages/new" label="New page" />
