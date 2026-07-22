<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import ReflectionForm from '$lib/components/admin/ReflectionForm.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>new reflection — admin — ruakh</title>
</svelte:head>

<section class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">new reflection</h1>
  </header>

  <ReflectionForm action="?/create" error={form?.error} />
</section>
