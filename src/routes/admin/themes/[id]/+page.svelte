<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>edit theme — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">edit theme</h1>
  </header>

  <form method="POST" action="?/update" use:enhance>
    <label class="panel-field">
      Name
      <input type="text" name="name" value={data.theme.name} required />
    </label>

    <label class="panel-field">
      Background
      <input type="color" name="bg" value={data.theme.bg} required />
    </label>

    <label class="panel-field">
      Line
      <input type="color" name="line" value={data.theme.line} required />
    </label>

    <label class="panel-field">
      Text
      <input type="color" name="ink" value={data.theme.ink} required />
    </label>

    {#if form?.error}<p class="panel-error">{form.error}</p>{/if}

    <button type="submit" class="panel-save">Save</button>
  </form>

  <form
    method="POST"
    action="?/delete"
    use:enhance={({ cancel }) => {
      if (!confirm('Delete this theme? This cannot be undone.')) cancel();
    }}
  >
    <button type="submit" class="panel-link-btn">delete this theme</button>
  </form>
</main>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
</style>
