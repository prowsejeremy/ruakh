<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
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

  function matches(f: FavoriteRecord, needle: string): boolean {
    if (!needle) return true;
    const haystack = [f.body.map(blocksToText).join(' '), f.attribution, f.source]
      .filter((v): v is string => !!v)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }

  let filtered = $derived(favorites.filter((f) => matches(f, query.trim().toLowerCase())));

  async function unsave(id: number) {
    await removeFavorite(id);
    favorites = favorites.filter((f) => f.id !== id);
  }
</script>

<svelte:head>
  <title>saved reflections — preferences — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="var(--color-accent)" />
    <h1 class="panel-title">saved reflections</h1>
  </header>

  {#if favorites.length > 0}
    <div class="panel-search-wrap">
      <input class="panel-search" type="text" placeholder="Search..." bind:value={query} />
      <span class="panel-search-icon"><Icon name="search" size="1.9rem" /></span>
    </div>
  {/if}

  <div class="panel-list">
    {#each filtered as fav (fav.id)}
      <div class="panel-card card-linked" in:reveal|global>
        <a class="card-link" href="/reflections/{fav.id}">
          <div class="panel-card-title">{preview(fav.body.map(blocksToText).join(' '))}</div>
        </a>
        <div class="panel-card-meta meta-row">
          <span>{formatAttribution(fav.attribution, fav.source) ?? ''}</span>
          <button type="button" class="panel-link-btn" onclick={() => unsave(fav.id)}>
            remove
          </button>
        </div>
      </div>
    {:else}
      <p class="panel-blurb">{loaded ? 'Nothing saved yet.' : 'Loading…'}</p>
    {/each}
  </div>
</main>

<style>
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  /* Stretched link: the whole card navigates, while the remove button
   * stays independently clickable above it. */
  .card-linked {
    position: relative;
  }

  .card-link {
    text-decoration: none;
    color: inherit;
  }

  .card-link::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  .meta-row .panel-link-btn {
    position: relative;
    z-index: 1;
  }
</style>
