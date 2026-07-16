<script lang="ts" module>
  // Inlined (rather than <img src>) so the currentColor strokes pick up
  // the surrounding text color. static/icons/ stays the single source
  // of truth.
  import add from '$lib/assets/icons/add.svg?raw';
  import back from '$lib/assets/icons/back.svg?raw';
  import close from '$lib/assets/icons/close.svg?raw';
  import forward from '$lib/assets/icons/forward.svg?raw';
  import heart from '$lib/assets/icons/heart.svg?raw';
  import preferences from '$lib/assets/icons/preferences.svg?raw';
  import search from '$lib/assets/icons/search.svg?raw';

  const icons = { add, back, close, forward, heart, preferences, search };
  export type IconName = keyof typeof icons;
</script>

<script lang="ts">
  let {
    name,
    className = '',
    size = '1.5em',
    background,
  }: { name: IconName; size?: string; background?: string, className?: string } = $props();
</script>

<span
  class={`icon ${className}`}
  style:width={size}
  style:height={size}
  style:--icon-bg={background}
  aria-hidden="true">{@html icons[name]}</span
>

<style>
  .icon {
    display: inline-block;
    flex: none;

    /* :global is necessary here — the SVG is injected via {@html}, so Svelte
       can't scope styles onto it. */
    :global(svg) {
      display: block;
      width: 100%;
      height: 100%;
      fill: transparent;
      transition: fill 300ms var(--transition-timing);

      :global {
        /* The drawn strokes. `fill` is an overridable hook (default: unfilled
       outline) so a parent can fill the icon by setting --icon-fill, mirroring
       --icon-bg for the bounding circle. */
        path {
          fill: var(--icon-fill, transparent);
          transition: fill 300ms var(--transition-timing);
        }

        /* Each icon's bounding circle stays invisible unless a background
        color is passed in. */
        .icon-bg {
          fill: var(--icon-bg, transparent);
        }
      }
    }
  }
</style>
