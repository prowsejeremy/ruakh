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

<section class="reflections-list" out:reveal|global>
  {#if !history.length}
    <p class="panel-blurb" in:reveal|global={{delay: 500}}>{'Your past reflections will gather here.'}</p>
  {:else}
    <div class="panel-search-wrap" in:reveal|global={{delay: 500}}>
      <input class="panel-search" type="text" placeholder="Search..." bind:value={query} />
      <span class="panel-search-icon"><Icon name="search" size="1.9rem" /></span>
    </div>

    {#if !filtered.length}
      <p class="panel-blurb" in:reveal|global={{delay: 500}}>{'No reflections match that search.'}</p>
    {:else if !loaded}
      <p class="panel-blurb" in:reveal|global={{delay: 500}}>{'Loading…'}</p>
    {:else}
      <div class="panel-list">
        {#each filtered as entry (entry.seenOn)}
          <a class="panel-card" href="/reflections/{entry.id}" in:reveal|global={{delay: 500}}>
            <div class="panel-card-title">{preview(entry.body.map(blocksToText).join(' '))}</div>
            <div class="panel-card-meta meta-row">
              <small>{formatAttribution(entry.attribution, entry.source) ?? ''}</small>
              <small>{entry.seenOn}</small>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</section>

<style>
  .reflections-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 0 0 100%;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
</style>
