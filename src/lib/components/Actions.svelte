<script lang="ts">
  import { browser } from '$app/environment';
  import { addFavorite, removeFavorite, isFavorite } from '$lib/client/storage';
  import Icon from '$lib/components/Icon.svelte';
  import { reveal } from '$lib/transitions';
  import type { ReflectionView } from '$lib/types';

  // Each action is opt-in. `save` carries the reflection to favorite: passing
  // it both enables the heart button and feeds the favorite logic below.
  // `preferences` is a plain toggle for the settings link.
  // `exitRoute` is threaded to the preferences page (via the `exit` query
  // param) so its close button returns here; the page defaults to `/` when unset.
  let {
    save = null,
    preferences = false,
    exitRoute = null,
  }: { save?: ReflectionView | null; preferences?: boolean; exitRoute?: string | null } = $props();

  const preferencesHref = $derived(
    exitRoute ? `/preferences?exit=${encodeURIComponent(exitRoute)}` : '/preferences',
  );

  let saved = $state(false);

  $effect(() => {
    if (browser && save) {
      // Guard against a stale response clobbering a toggle made before it
      // resolved (and against `save` changing identity in the future).
      const id = save.id;
      isFavorite(id)
        .then((v) => {
          if (save?.id === id) saved = v;
        })
        .catch(() => {}); // storage unavailable: leave default state
    }
  });

  async function toggleSave() {
    if (!save) return;
    try {
      if (saved) {
        await removeFavorite(save.id);
        saved = false;
      } else {
        await addFavorite(save);
        saved = true;
      }
    } catch {
      // Storage unavailable (private browsing etc.): leave state unchanged.
    }
  }
</script>

<div class="actions" in:reveal|global>
  {#if save}
    <button type="button" aria-pressed={saved} aria-label={saved ? 'saved' : 'save'} onclick={toggleSave}>
      <Icon name="heart" size="2rem" />
    </button>
  {/if}
  {#if preferences}
    <a href={preferencesHref} aria-label="preferences">
      <Icon name="preferences" size="2rem" />
    </a>
  {/if}
</div>

<style>
  .actions {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-small);
    align-self: flex-end;
    margin-top: auto;
    width: 100%;

    button {
      background: none;
      border: none;
      font: inherit;
      cursor: pointer;
      padding: 0;

      /* Fill the heart while the reflection is saved. Icon exposes `fill` as
         the --icon-fill hook (see Icon.svelte), so we set a value instead of
         reaching into its internals with :global(path). */
      &[aria-pressed='true'] {
        --icon-fill: currentColor;
      }
    }

    button,
    a {
      display: inline-flex;
      color: inherit;
    }
  }
</style>
