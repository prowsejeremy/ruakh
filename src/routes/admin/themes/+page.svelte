<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>themes — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">themes</h1>
  </header>

  <div class="panel-swatch-grid">
    {#each data.themes as t (t.id)}
      <a class="panel-swatch" href="/admin/themes/{t.id}" style="--sw-bg: {t.bg}; --sw-line: {t.line};">
        <span class="panel-swatch-preview"></span>
        <span class="panel-swatch-name">{t.name}</span>
      </a>
    {:else}
      <p class="panel-blurb">No themes found.</p>
    {/each}
  </div>

  <a class="admin-fab" href="/admin/themes/new" aria-label="New theme"><Icon name="add" background="#101010" size="100%" /></a>
</main>
