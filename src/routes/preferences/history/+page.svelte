<script lang="ts">
  import { reveal } from '$lib/transitions';
  import { browser } from '$app/environment';
  import { formatAttribution } from '$lib/format';
  import { listHistory, type HistoryRecord } from '$lib/client/storage';
  import { blocksToText } from '$lib/markdown';
  import Icon from '$lib/components/Icon.svelte';

  let history = $state<HistoryRecord[]>([]);
  let loaded = $state(false);
  let query = $state('');

  $effect(() => {
    if (!browser) return;
    listHistory()
      .then((h) => {
        history = h;
        loaded = true;
      })
      .catch(() => {
        // Storage unavailable: show the empty state rather than 'Loading…' forever.
        loaded = true;
      });
  });

  function preview(body: string): string {
    return body.length > 90 ? body.slice(0, 90) + '…' : body;
  }

  function matches(entry: HistoryRecord, needle: string): boolean {
    if (!needle) return true;
    const haystack = [entry.body.map(blocksToText).join(' '), entry.attribution, entry.source]
      .filter((v): v is string => !!v)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }

  let filtered = $derived(history.filter((entry) => matches(entry, query.trim().toLowerCase())));
</script>

{#if history.length > 0}
  <div class="panel-search-wrap" in:reveal|global out:reveal|global>
    <input class="panel-search" type="text" placeholder="Search..." bind:value={query} />
    <span class="panel-search-icon"><Icon name="search" size="1.9rem" /></span>
  </div>
{/if}

<div class="panel-list" out:reveal|global>
  {#each filtered as entry (entry.seenOn)}
    <a class="panel-card" href="/reflections/{entry.id}" in:reveal|global>
      <div class="panel-card-title">{preview(entry.body.map(blocksToText).join(' '))}</div>
      <div class="panel-card-meta meta-row">
        <small>{formatAttribution(entry.attribution, entry.source) ?? ''}</small>
        <small>{entry.seenOn}</small>
      </div>
    </a>
  {:else}
    <p class="panel-blurb" in:reveal|global>{loaded ? 'Your past reflections will gather here.' : 'Loading…'}</p>
  {/each}
</div>

<style>
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
</style>
