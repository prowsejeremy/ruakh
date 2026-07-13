<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { blocksToText, type ContentBlock } from '$lib/markdown';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let query = $state('');

  function preview(sections: ContentBlock[][]): string {
    const text = blocksToText(sections[0] ?? []);
    return text.length > 90 ? text.slice(0, 90) + '…' : text;
  }

  function matches(q: (typeof data.reflections)[number], needle: string): boolean {
    if (!needle) return true;
    const haystack = [q.sections.map(blocksToText).join(' '), q.attribution, q.source, q.copyright]
      .filter((v): v is string => !!v)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }

  let filtered = $derived(
    data.reflections.filter((q) => matches(q, query.trim().toLowerCase()))
  );
</script>

<svelte:head>
  <title>reflections — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">reflections</h1>
  </header>

  <div class="panel-search-wrap">
    <input
      class="panel-search"
      type="text"
      placeholder="Search..."
      bind:value={query}
    />
    <span class="panel-search-icon"><Icon name="search" size="1.9rem" /></span>
  </div>

  <div class="panel-list">
    {#each filtered as q (q.id)}
      <a class="panel-card" href="/admin/reflections/{q.id}">
        <div class="panel-card-title">{preview(q.sections)}</div>
        <div class="panel-card-meta">
          {#if q.attribution}{q.attribution}{:else}&nbsp;{/if}
          {#if !q.isPublished}<span class="panel-card-flag">· unpublished</span>{/if}
        </div>
      </a>
    {:else}
      <p class="panel-blurb">No reflections found.</p>
    {/each}
  </div>

  <a class="admin-fab" href="/admin/reflections/new" aria-label="New reflection"><Icon name="add" background="#101010" size="100%" /></a>
</main>
