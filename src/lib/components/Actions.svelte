<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { addFavorite, removeFavorite, isFavorite } from '$lib/client/storage';
  import Icon, {type IconName } from '$lib/components/Icon.svelte';
  import { reveal } from '$lib/transitions';
  import type { ReflectionView } from '$lib/types';

  type NavLinkType = { href: string; label: string; icon: IconName };

  // `save` carries the reflection to favorite: passing it both enables the
  // heart button and feeds the favorite logic below.
  let { save = null }: { save?: ReflectionView | null } = $props();

  const currentRoute = page.url.pathname;

  // Actions only ever renders on the page you'd leave to open preferences
  // (never on a preferences page itself), so the current pathname is the
  // exit target. It's threaded through the `exit` query param so the
  // preferences close button returns here; that page falls back to `/`.
  const preferencesHref = $derived(
    `/preferences?exit=${encodeURIComponent(page.url.pathname)}`,
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

  const navLinks = $derived.by((): NavLinkType[] => [
    { href: '/', label: 'home', icon: 'home' },
    { href: '/breathe', label: 'breathe', icon: 'breathe' },
    { href: preferencesHref, label: 'preferences', icon: 'preferences' },
  ]);
</script>

{#snippet NavLink({href, label, icon}: { href: string; label: string; icon: IconName; })}
  <a href={href} aria-label={label} class={icon}>
    <Icon name={icon} size="2rem" background={currentRoute === href ? 'rgba(var(--color-ink-rgb), 0.2)' : 'transparent'} />
  </a>
{/snippet}

<div class="actions" in:reveal|global out:reveal|global>
  <!-- Reflection save button -->
  {#if save && save.id}
    <button type="button" aria-label={saved ? 'saved' : 'save'} onclick={toggleSave} class="save">
      <Icon name="heart" fill={saved ? 'currentColor' : 'transparent'} size="2rem" />
    </button>
  {/if}
  
  {#each navLinks as { href, label, icon } (href)}
    {@render NavLink({ href, label, icon })}
  {/each}
</div>

<style>
  .actions {
    display: grid;
    grid-template-columns: repeat(4, auto);
    grid-template-areas: 
      "save home breathe preferences";
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
    }

    .save {
      grid-area: save;
    }

    .home {
      grid-area: home;
    }

    .breathe {
      grid-area: breathe;
    }

    .preferences {
      grid-area: preferences;
    }

    button,
    a {
      display: inline-flex;
      color: inherit;
    }
  }
</style>
