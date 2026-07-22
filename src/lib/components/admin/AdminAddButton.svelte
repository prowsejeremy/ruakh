<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  
  let { href, label }: { href: string; label: string } = $props();
</script>

<a class="admin-fab" href={href} aria-label={label}><Icon name="add" background="var(--color-ink)" size="100%" /></a>

<style>
  .admin-fab {
    position: fixed;
    right: var(--app-gutter);
    bottom: var(--app-gutter);
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-bg);
    font-size: 1.75rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    :global(svg) {
      overflow: visible;
    }
    :global(svg circle) {
      filter: drop-shadow(0 0 2rem rgba(var(--color-bg-rgb), 0.8));
    }
  }
</style>