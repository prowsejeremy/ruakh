<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>new theme — admin — ruakh</title>
</svelte:head>

<section class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">new theme</h1>
  </header>

  <form method="POST" action="?/create" use:enhance>
    <label class="panel-field">
      Name
      <input type="text" name="name" required />
    </label>

    <label class="panel-field">
      Background
      <input type="color" name="bg" value="#f7a31a" required />
    </label>

    <label class="panel-field">
      Line
      <input type="color" name="line" value="#f5350b" required />
    </label>

    <label class="panel-field">
      Text
      <input type="color" name="ink" value="#000000" required />
    </label>

    {#if form?.error}<p class="panel-error">{form.error}</p>{/if}

    <button type="submit" class="panel-save">Save</button>
  </form>
</section>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
</style>
