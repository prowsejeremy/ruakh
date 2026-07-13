<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>users — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">users</h1>
  </header>

  {#if form?.error}<p class="panel-error">{form.error}</p>{/if}

  <div class="panel-list">
    {#each data.admins as admin (admin.id)}
      <div class="panel-card user-card">
        <div>
          <div class="panel-card-title">{admin.email}</div>
          <div class="panel-card-meta">{admin.createdAt.toISOString().slice(0, 10)}</div>
        </div>
        <form
          method="POST"
          action="?/delete"
          use:enhance={({ cancel }) => {
            if (!confirm(`Remove admin ${admin.email}?`)) cancel();
          }}
        >
          <input type="hidden" name="id" value={admin.id} />
          <button type="submit" class="panel-link-btn">remove</button>
        </form>
      </div>
    {:else}
      <p class="panel-blurb">No users found.</p>
    {/each}
  </div>

  <a class="admin-fab" href="/admin/users/new" aria-label="New user"><Icon name="add" background="#101010" size="100%" /></a>
</main>

<style>
  .user-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
</style>
