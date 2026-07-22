<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import MarkdownHelp from '$lib/components/admin/MarkdownHelp.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>new page — admin — ruakh</title>
</svelte:head>

<section class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">new page</h1>
  </header>

  <form method="POST" action="?/create" use:enhance>
    <label class="panel-field">
      Uri
      <input type="text" name="uri" required />
    </label>

    <div class="panel-field">
      <div class="panel-field-head">
        <label for="content">Content</label>
        <MarkdownHelp />
      </div>
      <textarea id="content" name="content" rows="10" required></textarea>
    </div>

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
