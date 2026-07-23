<script lang="ts">
  import AdminAddButton from '$lib/components/admin/AdminAddButton.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>themes — admin — ruakh</title>
</svelte:head>

<section class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">themes</h1>
  </header>

  <div class="panel-swatch-grid">
    {#each data.themes as t (t.id)}
      <a class="panel-swatch" href="/admin/themes/{t.id}" style="--sw-bg: {t.bg}; --sw-accent: {t.accent};">
        <span class="panel-swatch-preview"></span>
        <span class="panel-swatch-name">{t.name}</span>
      </a>
    {:else}
      <p class="panel-blurb">No themes found.</p>
    {/each}
  </div>
</section>
<AdminAddButton href="/admin/themes/new" label="New theme" />
