<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import Toggle from '$lib/components/Toggle.svelte';
  import { browser } from '$app/environment';
  import { toUtcMinute } from '$lib/push-time';
  import { reveal } from '$lib/transitions';
  import {
    pushSupported,
    currentSubscription,
    enableReminder,
    disableReminder,
    syncSubscription
  } from '$lib/client/push';
  import { clearAllData } from '$lib/client/storage';
  import { clearContent } from '$lib/client/content';

  const TIME_KEY = 'ruakh:reminder-time';

  let supported = $state(false);
  let enabled = $state(false);
  let time = $state('07:00'); // local HH:MM
  let busy = $state(false);
  let erased = $state(false);
  let error = $state<string | null>(null);

  const ERRORS: Record<string, string> = {
    denied: 'Notifications are blocked for this site — allow them in your browser settings.',
    unsupported: 'Notifications are not available in this browser.',
    error: 'Something went wrong enabling the reminder — please try again.'
  };

  $effect(() => {
    if (!browser) return;
    supported = pushSupported();
    try {
      time = localStorage.getItem(TIME_KEY) ?? '07:00';
    } catch {
      /* default stands */
    }
    currentSubscription().then((sub) => {
      enabled = !!sub;
      // Self-heal: if the device is subscribed, quietly re-register with the
      // server so a pruned/lost server row comes back. Never double-sends
      // (the upsert preserves an already-delivered day).
      if (sub) syncSubscription(toUtcMinute(time, new Date().getTimezoneOffset()));
    });
  });

  async function toggleReminders() {
    if (busy) return;
    busy = true;
    error = null;
    try {
      if (enabled) {
        await disableReminder();
        enabled = false;
      } else {
        const minute = toUtcMinute(time, new Date().getTimezoneOffset());
        const result = await enableReminder(minute);
        if (result === 'ok') {
          enabled = true;
        } else {
          error = ERRORS[result];
        }
      }
    } finally {
      busy = false;
    }
  }

  async function changeTime() {
    if (busy) return;
    try {
      localStorage.setItem(TIME_KEY, time);
    } catch {
      /* on-device nicety only */
    }
    if (enabled) {
      // Re-register with the new minute (same endpoint upserts in place).
      busy = true;
      error = null;
      try {
        const result = await enableReminder(toUtcMinute(time, new Date().getTimezoneOffset()));
        if (result !== 'ok') error = ERRORS[result];
      } finally {
        busy = false;
      }
    }
  }

  async function eraseAll() {
    if (busy) return;
    busy = true;
    try {
      await disableReminder().catch(() => {});
      await clearAllData().catch(() => {});
      await clearContent().catch(() => {});
      try {
        localStorage.clear();
      } catch {
        /* nothing to do */
      }
      enabled = false;
      erased = true;
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>your device — preferences — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="var(--color-accent)" />
    <h1 class="panel-title">your device</h1>
  </header>

  <section in:reveal|global>
    <div class="row">
      <label for="daily-reminder">
        <h2>Daily reminder;</h2>
      </label>
      {#if supported}
        <Toggle
          id="daily-reminder"
          checked={enabled}
          onchange={toggleReminders}
          disabled={busy}
          label="Daily reminder"
        />
      {/if}
    </div>
    {#if supported}
      <p class="panel-note">
        One gentle nudge a day. Turning it off removes your subscription from our server
        immediately — nothing about you is stored, only an anonymous delivery address.
      </p>
      {#if enabled}
        <label>
          <input type="time" bind:value={time} onchange={changeTime} step="300" />
        </label>
      {/if}
      {#if error}<p class="panel-note panel-error">{error}</p>{/if}
    {:else}
      <p class="panel-note">
        Notifications aren't available in this browser. On iPhone/iPad, add ruakh to your Home
        Screen first (Share &rarr; Add to Home Screen), then return here.
      </p>
    {/if}
  </section>

  <section in:reveal|global>
    <h2>Your device;</h2>
    <p class="panel-note">
      Everything personal — saved reflections, your history, preferences — lives only on this device.
    </p>
    <p class="row">
      <button type="button" class="panel-link-btn" onclick={eraseAll} disabled={busy}>
        erase everything on this device
      </button>
    </p>
    {#if erased}<p class="panel-note">Done. This device holds nothing now.</p>{/if}
  </section>
</main>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  h2 {
    font-size: 1.35rem;
    font-weight: 400;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  input[type='time'] {
    font: inherit;
    background: none;
    border: 1px solid var(--color-ink);
    border-radius: 0.25rem;
    padding: 0.15rem 0.4rem;
    color: inherit;
  }
</style>
