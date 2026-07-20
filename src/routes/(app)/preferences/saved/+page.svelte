<script lang="ts">
  import { reveal } from '$lib/transitions';
  import { browser } from '$app/environment';
  import { formatAttribution } from '$lib/format';
  import { listFavorites, removeFavorite, type FavoriteRecord } from '$lib/client/storage';
  import { blocksToText } from '$lib/markdown';
  import Icon from '$lib/components/Icon.svelte';

  let favorites = $state<FavoriteRecord[]>([]);
  let loaded = $state(false);
  let query = $state('');

  $effect(() => {
    if (!browser) return;
    listFavorites()
      .then((f) => {
        favorites = f;
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

  function matches(entry: FavoriteRecord, needle: string): boolean {
    if (!needle) return true;
    const haystack = [entry.body.map(blocksToText).join(' '), entry.attribution, entry.source]
      .filter((v): v is string => !!v)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }

  let filtered = $derived(favorites.filter((entry) => matches(entry, query.trim().toLowerCase())));

  async function unsave(id: number) {
    await removeFavorite(id);
    favorites = favorites.filter((f) => f.id !== id);
  }
</script>

<section class="reflections-list" out:reveal|global>
  {#if !favorites.length}
    <p class="panel-blurb" in:reveal|global={{delay: 500}}>{'Nothing saved yet.'}</p>
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
        {#each filtered as entry (entry.id)}
          <div class="panel-card card-linked" in:reveal|global={{delay: 500}}>
            <a class="card-link" href="/reflections/{entry.id}">
              <div class="panel-card-title">{preview(entry.body.map(blocksToText).join(' '))}</div>
            </a>
            <div class="panel-card-meta meta-row">
              <small>{formatAttribution(entry.attribution, entry.source) ?? ''}</small>
              <button type="button" class="panel-link-btn" onclick={() => unsave(entry.id)}>
                remove
              </button>
            </div>
          </div>
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

    .panel-link-btn {
      position: relative;
      z-index: 1;
    }
  }

  /* Stretched link: the whole card navigates, while the remove button
   * stays independently clickable above it. */
  .card-linked {
    position: relative;
  }

  .card-link {
    text-decoration: none;
    color: inherit;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
    }
  }
</style>
