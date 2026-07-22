<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';
  import AdminAddButton from '$lib/components/admin/AdminAddButton.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>users — admin — ruakh</title>
</svelte:head>

<section class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">users</h1>
  </header>

  {#if form?.error}<p class="panel-error">{form.error}</p>{/if}

  <div class="panel-list">
    {#each data.admins as admin (admin.id)}
      <div class="panel-card user-card">
        {#if admin.id === data.currentId}
          <a class="user-card-edit" href="/admin/users/{admin.id}">
            <div class="panel-card-title">{admin.email}</div>
            <div class="panel-card-meta">{admin.createdAt.toISOString().slice(0, 10)} · you — edit</div>
          </a>
        {:else}
          <div>
            <div class="panel-card-title">{admin.email}</div>
            <div class="panel-card-meta">{admin.createdAt.toISOString().slice(0, 10)}</div>
          </div>
        {/if}
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
</section>
<AdminAddButton href="/admin/users/new" label="New user" />

<style>
  .user-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
</style>
