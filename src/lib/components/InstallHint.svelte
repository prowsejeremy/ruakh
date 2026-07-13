<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { browser } from '$app/environment';
  import { installState } from '$lib/client/install.svelte';
  import { reveal, type RevealParams } from '$lib/transitions';

  const DISMISS_KEY = 'ruakh:install-dismissed';

  let isIos = $state(false);
  let standalone = $state(true); // assume installed until the browser says otherwise
  let dismissed = $state(true); // assume dismissed until read — avoids a flash

  const installEvent = $derived(installState.event);

  $effect(() => {
    if (!browser) return;
    standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);
    // iPadOS Safari reports a Macintosh UA; multi-touch tells it apart.
    const ua = navigator.userAgent;
    isIos =
      /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      dismissed = false;
    }
  });

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // storage unavailable: dismissal just won't persist
    }
  }

  async function install() {
    await installState.event?.prompt();
    installState.event = null;
  }
</script>

{#if !standalone && !dismissed && (installEvent || isIos)}
  <aside aria-label="Install ruakh" in:reveal|global out:reveal|global>
    {#if installEvent}
      <button type="button" class="prompt-content install-button" onclick={install}>
        <img class="app-icon" src="/app-icons/ruakh.svg" alt="Ruakh App Icon" width="32" height="32" />
        <span>Add ruakh to your home screen</span>
      </button>
    {:else}
      <div class="prompt-content">
        <img class="app-icon" src="/app-icons/ruakh.svg" alt="Ruakh App Icon" width="32" height="32" />
        <p>To keep ruakh close: Share &gt; Add to Home Screen</p>
      </div>
    {/if}
    <button type="button" class="close" aria-label="Dismiss" onclick={dismiss}>
      <Icon name="close" size="100%" />
    </button>
  </aside>
{/if}

<style>
  aside {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    margin: 0.5rem;
    border-radius: 0.5rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
    font-size: var(--text-small);
    background: var(--color-ink);
    color: var(--color-bg);
    box-shadow: 0 0 5px rgba(var(--color-ink-rgb), 0.1);
  }
  button {
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    padding: 0;
  }
  .app-icon {
    flex: none;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.2rem;
  }
  .install-button {
    text-decoration: underline;
  }
  .prompt-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
  .close {
    font-size: 1.1rem;
    line-height: 1;
    width: 2rem;
    height: 2rem;
  }
  p {
    margin: 0;
  }
</style>
