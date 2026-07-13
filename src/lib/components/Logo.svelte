<script lang="ts" module>
  import RuakhLogo from '../../../static/ruakh-logo.svg?raw';
</script>

<script lang="ts">
  let {
    name,
    size = '2rem',
    background,
  }: { name: IconName; size?: string; color?: string } = $props();
</script>

<span
  class="logo"
  style:width={size}
  aria-hidden="true">{@html RuakhLogo}</span
>

<style>
  .logo {
    display: inline-block;
    flex: none;
    width: 100%;
  }
  .logo :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    color: var(--color-ink);
    transition: fill 300ms var(--transition-timing);
  }
</style>
