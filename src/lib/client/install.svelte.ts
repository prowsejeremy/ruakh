import { browser } from '$app/environment';

export type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

/**
 * Chrome fires `beforeinstallprompt` once per page load — often before the
 * intro splash ends and InstallHint mounts. Capture it at module scope (this
 * module is imported from the root layout, so it evaluates early) and stash
 * it in shared state for InstallHint to consume.
 */
export const installState = $state<{ event: BeforeInstallPromptEvent | null }>({ event: null });

if (browser) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installState.event = e as BeforeInstallPromptEvent;
  });
  // On install, pull the whole published set down for full offline operation.
  window.addEventListener('appinstalled', () => {
    installState.event = null;
    import('./content').then((m) => m.refreshContentBundle());
  });
}
