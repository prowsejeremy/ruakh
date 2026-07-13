<script lang="ts">
  import { enhance } from '$app/forms';
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <h1 class="panel-title">admin</h1>

  <p class="panel-blurb">Manage all reflections, pages and themes in this dashboard.</p>

  <nav class="menu">
    <a class="panel-menu-btn" href="/admin/reflections">Reflections <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" href="/admin/pages">Pages <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" href="/admin/themes">Themes <Icon name="forward" size="1.9rem" /></a>
    <a class="panel-menu-btn" href="/admin/users">Users <Icon name="forward" size="1.9rem" /></a>
  </nav>

  <p class="panel-blurb">{data.subscriberCount} daily-reminder subscriptions (anonymous)</p>

  <form method="POST" action="?/logout" use:enhance class="signout">
    <button type="submit" class="panel-link-btn">sign out</button>
  </form>
</main>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .signout {
    align-self: flex-end;
  }
</style>
