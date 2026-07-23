<script lang="ts">
  import ReflectionScreen from '$lib/components/ReflectionScreen-refined.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>ruakh</title>
</svelte:head>

<ReflectionScreen reflection={data.reflection} />
