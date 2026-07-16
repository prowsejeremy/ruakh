<script lang="ts" module>
  import RuakhLogo from '../../../static/ruakh-logo.svg?raw';
</script>

<script lang="ts">
  let {
    size = '2rem',
    className
  }: { className?: string; size?: string } = $props();
</script>

<span
  class="logo {className}"
  style:width={size}
  aria-hidden="true">{@html RuakhLogo}</span
>

<style>
  .logo {
    display: inline-block;
    flex: none;
    width: 100%;

    /* :global is necessary — the SVG is injected via {@html}. */
    :global(svg) {
      display: block;
      width: 100%;
      height: 100%;
      color: var(--color-ink);
      transition: fill 300ms var(--transition-timing);
    }
  }
</style>
