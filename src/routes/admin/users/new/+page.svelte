<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>new user — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">new user</h1>
  </header>

  {#if form?.password}
    <p class="panel-blurb">
      Admin created for <strong>{form.email}</strong>. Store this password now — it won't be shown
      again:
    </p>
    <p class="panel-card-title">{form.password}</p>
  {:else}
    <form method="POST" action="?/create" use:enhance>
      <label class="panel-field">
        Email
        <input type="email" name="email" required />
      </label>

      {#if form?.error}<p class="panel-error">{form.error}</p>{/if}

      <button type="submit" class="panel-save">Save</button>
    </form>
  {/if}
</main>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
</style>
