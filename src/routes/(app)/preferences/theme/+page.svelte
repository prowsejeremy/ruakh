<script lang="ts">
  import { reveal } from '$lib/transitions';
  import { getCachedThemes } from '$lib/client/content';
  import type { Theme } from '$lib/themes';
  import { loadTheme, saveTheme } from '$lib/client/theme';
  import type { PageData } from './$types';

  import { onMount } from 'svelte';

  let { data }: { data: PageData } = $props();

  let activeThemeId = $state('sunset');
  // Prefer SSR themes (fresh online); fall back to the cached bundle offline.
  // svelte-ignore state_referenced_locally — intentional one-time initial value
  let themeList = $state<typeof data.themes>(data.themes);

  // One-shot init: onMount, NOT $effect — resolveActive reads themeList, which
  // would make it a tracked dependency and (offline) loop forever as the
  // cached-bundle fallback keeps assigning fresh arrays.
  onMount(() => {
    resolveActive(); // against SSR themes (online)
    // Offline (SW served a cached page with no themes): use the cached bundle,
    // then re-resolve the active ring against it.
    if (data.themes.length === 0) {
      getCachedThemes().then((t) => {
        if (t.length) {
          themeList = t;
          resolveActive();
        }
      });
    }
  });

  // Resolve the saved snapshot to a themeList id — by id, then by exact colors
  // (covers the pre-pick fallback snapshot, whose id is 'sunset' while DB ids
  // are numeric).
  function resolveActive() {
    const snap = loadTheme();
    const byId = themeList.find((t) => String(t.id) === snap.id);
    const byColors = themeList.find(
      (t) => t.bg === snap.bg && t.accent === snap.accent && t.ink === snap.ink
    );
    activeThemeId = byId || byColors ? String((byId ?? byColors)!.id) : snap.id;
  }

  function toTheme(t: (typeof data.themes)[number]): Theme {
    return { id: String(t.id), name: t.name, bg: t.bg, accent: t.accent, ink: t.ink };
  }

  function chooseTheme(t: (typeof data.themes)[number]) {
    const theme = toTheme(t);
    activeThemeId = theme.id;
    saveTheme(theme); // applies live (CSS vars) + persists on-device
  }
</script>

<!-- Container carries `out` (the grid leaves as one block); each swatch carries
     `in` so the batch orders itself by position, row by row, left to right. -->
<div class="panel-swatch-grid" out:reveal|global>
  {#each themeList as t (t.id)}
    <button
      type="button"
      class="panel-swatch"
      in:reveal|global
      class:active={activeThemeId === String(t.id)}
      aria-pressed={activeThemeId === String(t.id)}
      onclick={() => chooseTheme(t)}
    >
      <span
        class="panel-swatch-preview"
        style="--sw-bg: {t.bg}; --sw-accent: {t.accent};"
      ></span>
      <span class="panel-swatch-name">{t.name}</span>
    </button>
  {:else}
    <p class="panel-blurb" in:reveal|global>No themes found.</p>
  {/each}
</div>
