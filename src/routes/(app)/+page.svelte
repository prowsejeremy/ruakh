<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import IntroScreen from '$lib/components/IntroScreen.svelte';
  import ReflectionScreen from '$lib/components/ReflectionScreen-refined.svelte';
  import OnboardingScreen from '$lib/components/OnboardingScreen.svelte';
  import InstallHint from '$lib/components/InstallHint.svelte';
  import { recordHistory } from '$lib/client/storage';
  import { intro } from '$lib/client/intro.svelte';
  import { actionsBar } from '$lib/client/actions-bar.svelte';
  import { loadUserSettings, saveUserSettings } from '$lib/client/user-settings';
  import { refreshContentBundle, getOfflineDailyReflection } from '$lib/client/content';
  import { utcDateKey } from '$lib/daily';
  import type { ReflectionView } from '$lib/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  // Play the intro once per full page load — not on every client-side return
  // to `/`. `intro.done` also gates the root layout's header wordmark.
  const showIntro = $derived(!intro.done);
  // One-time onboarding: after the intro, first-time visitors see the about
  // page's content before their first reflection. `intro.onboarded` is seeded
  // from the device-local `ruakh:user` object; skipped when no about page exists.
  const showOnboarding = $derived(intro.done && !intro.onboarded && data.about !== null);

  function dismissOnboarding() {
    saveUserSettings({ ...loadUserSettings(), onboarded: true });
    intro.onboarded = true;
  }

  // Hide the actions bar while onboarding shows (same mechanism as /breathe) so
  // the dismiss button is the single path forward; navigating away re-runs the
  // layout's pathname effect, which restores the bar.
  $effect(() => {
    actionsBar.visible = !showOnboarding;
  });

  // The offline-recomputed reflection overrides the SSR one when the SW served a
  // stale (past-day) cached page — the app stays correct offline, indefinitely.
  let offlineReflection = $state<ReflectionView | null>(null);
  const shownReflection = $derived(offlineReflection ?? data.reflection);

  // Runs once per mount by design: a page left open across UTC midnight keeps
  // showing the day it loaded with until the next navigation/reload — fitting
  // for a once-a-day ritual, and cheaper than a live rollover timer.
  async function initContentAndHistory() {
    const now = new Date();
    const todayKey = utcDateKey(now);

    if (data.dateKey === todayKey) {
      // Fresh SSR pick: record it now, keep the offline set current in the background.
      if (data.reflection) recordHistory(data.reflection, todayKey).catch(() => {});
      refreshContentBundle().catch(() => {});
      return;
    }

    // Stale cached page (offline, or the day rolled over): refresh if we can,
    // then recompute today's reflection locally from the downloaded set.
    await refreshContentBundle().catch(() => {});
    const local = await getOfflineDailyReflection(now);
    if (local) {
      offlineReflection = local;
      recordHistory(local, todayKey).catch(() => {});
    } else if (data.reflection) {
      recordHistory(data.reflection, data.dateKey).catch(() => {});
    }
  }

  onMount(() => {
    if (browser) void initContentAndHistory();
  });
</script>

<svelte:head>
  <title>ruakh</title>
</svelte:head>

{#if showIntro}
  <IntroScreen oncomplete={() => (intro.done = true)} />
{:else if showOnboarding}
  <OnboardingScreen blocks={data.about!} ondismiss={dismissOnboarding} />
{:else}
  <ReflectionScreen reflection={shownReflection} />
  <InstallHint />
{/if}
