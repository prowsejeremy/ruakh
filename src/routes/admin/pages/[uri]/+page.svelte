<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import MarkdownHelp from '$lib/components/admin/MarkdownHelp.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let content = $state(data.page.content);
</script>

<svelte:head>
  <title>edit page — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">edit page</h1>
  </header>

  <form method="POST" action="?/update" use:enhance>
    <label class="panel-field">
      Uri
      <input type="text" value={data.page.uri} disabled />
    </label>
    <input type="hidden" name="uri" value={data.page.uri} />

    <div class="panel-field">
      <div class="panel-field-head">
        <label for="content">Content</label>
        <MarkdownHelp />
      </div>
      <textarea id="content" name="content" rows="10" bind:value={content}></textarea>
    </div>

    {#if form?.error}<p class="panel-error">{form.error}</p>{/if}

    <button type="submit" class="panel-save">Save</button>
  </form>

  <form
    method="POST"
    action="?/delete"
    use:enhance={({ cancel }) => {
      if (!confirm('Delete this page? This cannot be undone.')) cancel();
    }}
  >
    <button type="submit" class="panel-link-btn">delete this page</button>
  </form>
</main>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  input:disabled {
    opacity: 0.6;
  }
</style>
