<script lang="ts">
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';

  let { href, background }: { href?: string; background?: string } = $props();

  // The parent route: the current path with its last segment removed,
  // unless overridden via `href`.
  const parent = $derived(href ?? (page.url.pathname.replace(/\/[^/]+\/?$/, '') || '/'));
</script>

<a class="panel-back" href={parent} aria-label="back">
  <Icon name="back" {background} size="100%" />
</a>
