import { env } from '$env/dynamic/public';

/**
 * Browser-side push plumbing for the preferences screens. All failures are
 * surfaced as return values (never throws) so the UI can render state.
 */

export type EnableResult = 'ok' | 'denied' | 'unsupported' | 'error';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  // Explicit ArrayBuffer backing so the type satisfies applicationServerKey.
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

function sameKey(existing: ArrayBuffer | null | undefined, current: Uint8Array): boolean {
  if (!existing) return true; // can't tell — assume compatible
  const a = new Uint8Array(existing);
  return a.length === current.length && a.every((v, i) => v === current[i]);
}

async function registerWithServer(sub: PushSubscription, reminderMinute: number): Promise<boolean> {
  const json = sub.toJSON();
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, reminderMinute })
  }).catch(() => null);
  return res?.ok ?? false;
}

/** Ask permission, subscribe, and register with the server. */
export async function enableReminder(reminderMinute: number): Promise<EnableResult> {
  if (!pushSupported() || !env.PUBLIC_VAPID_KEY) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const key = urlBase64ToUint8Array(env.PUBLIC_VAPID_KEY);
  const reg = await navigator.serviceWorker.ready;

  // A subscription created under a rotated/old VAPID key can never be
  // delivered to with the current key — drop it and subscribe fresh.
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub.options.applicationServerKey, key)) {
    await sub.unsubscribe().catch(() => {});
    sub = null;
  }

  sub =
    sub ??
    (await reg.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: key })
      .catch(() => null));
  if (!sub) return 'error';

  return (await registerWithServer(sub, reminderMinute)) ? 'ok' : 'error';
}

/**
 * Re-register an existing device subscription with the server (heals a
 * missing server row after e.g. a prune or DB reset). No permission prompt;
 * no-op when the device isn't subscribed. Safe: the server upsert never
 * causes a same-day double send.
 */
export async function syncSubscription(reminderMinute: number): Promise<void> {
  const sub = await currentSubscription();
  if (sub) await registerWithServer(sub, reminderMinute);
}

/** Unsubscribe on-device AND delete the server row — the immediate-erasure promise. */
export async function disableReminder(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint })
  }).catch(() => {});
}
