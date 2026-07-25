<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { reveal } from '$lib/transitions';
  import { getCachedPageLinks } from '$lib/client/content';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Prefer SSR links (fresh online); fall back to the cached bundle offline.
  // svelte-ignore state_referenced_locally — intentional one-time initial value
  let pageLinks = $state(data.pageLinks);

  onMount(() => {
    // Offline (SW served a cached page with no links): use the cached bundle.
    if (pageLinks.menu.length === 0 && pageLinks.footer.length === 0) {
      getCachedPageLinks().then((links) => {
        if (links.menu.length || links.footer.length) pageLinks = links;
      });
    }
  });
</script>

<!-- Container carries `out` (the whole menu leaves as one block); each button
     carries `in` so they stagger into place top-to-bottom on entry. -->
<div class="preferences-main" out:reveal|global>
  <nav class="menu">
    <a class="panel-menu-btn" in:reveal|global href="/preferences/theme">Theme <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" in:reveal|global href="/preferences/saved">Saved reflections <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" in:reveal|global href="/preferences/history">Past reflections <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" in:reveal|global href="/preferences/device">Your device <Icon name="forward" size="1.9rem" /></a>
    {#each pageLinks.menu as link (link.uri)}
      <a class="panel-menu-btn" in:reveal|global href="/{link.uri}">{link.title} <Icon name="forward" size="1.9rem" /></a>
    {/each}
  </nav>

  {#if pageLinks.footer.length}
    <footer class="footer" in:reveal|global>
      {#each pageLinks.footer as link (link.uri)}
        <a class="footer-link" href="/{link.uri}">{link.title}</a>
      {/each}
    </footer>
  {/if}
</div>

<style>
  .preferences-main {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  .menu {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .footer {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;

    .footer-link {
      font-size: 0.8rem;
      opacity: 0.7;
    }
  }
</style>
