<script lang="ts" module>
  // Inlined (rather than <img src>) so the currentColor strokes pick up
  // the surrounding text color. static/icons/ stays the single source
  // of truth.
  import add from '../../../static/icons/add.svg?raw';
  import back from '../../../static/icons/back.svg?raw';
  import close from '../../../static/icons/close.svg?raw';
  import forward from '../../../static/icons/forward.svg?raw';
  import heart from '../../../static/icons/heart.svg?raw';
  import preferences from '../../../static/icons/preferences.svg?raw';
  import search from '../../../static/icons/search.svg?raw';

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
