<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import ReflectionForm from '$lib/components/admin/ReflectionForm.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>edit reflection — admin — ruakh</title>
</svelte:head>

<section class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">edit reflection</h1>
  </header>

  <ReflectionForm
    action="?/update"
    error={form?.error}
    initial={{
      sections: data.reflection.sections,
      attribution: data.reflection.attribution,
      source: data.reflection.source,
      copyright: data.reflection.copyright,
      isPublished: data.reflection.isPublished
    }}
  />

  <form
    method="POST"
    action="?/delete"
    use:enhance={({ cancel }) => {
      if (!confirm('Delete this reflection? This cannot be undone.')) cancel();
    }}
  >
    <button type="submit" class="panel-link-btn">delete this reflection</button>
  </form>
</section>
