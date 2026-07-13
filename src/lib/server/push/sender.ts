import webpush from 'web-push';
import { env } from '$env/dynamic/private';
// PUBLIC_-prefixed vars are NOT exposed via $env/dynamic/private — the public
// key must come from the public env module.
import { env as publicEnv } from '$env/dynamic/public';
import { utcDateKey } from '$lib/daily';
import { getPublishedReflections } from '../db/reflections';
import { dueForSend } from './schedule';
import { allSubscriptions, markSent, deleteById } from './subscriptions';

let configured = false;

/** Configure web-push once; returns false if VAPID keys are absent (scheduler stays idle). */
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = publicEnv.PUBLIC_VAPID_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

const PAYLOAD = JSON.stringify({
  title: 'ruakh',
  body: 'Today’s reflection is waiting. Take a moment to breathe.'
});

// Statuses that mean this subscription can NEVER succeed with our VAPID key:
// 404/410 = endpoint gone; 400/401/403 = the push service rejects our
// authorization outright (e.g. subscription created under a different key).
// Retrying those forever would be an SSRF beacon and log spam.
const PERMANENT_FAILURE = new Set([400, 401, 403, 404, 410]);

let running = false;

/**
 * Send the daily reminder to every due subscription. Anonymous by design;
 * dead subscriptions (uninstalled app, cleared site data) come back as
 * 404/410 and are deleted on the spot — the self-pruning the spec promises.
 * Re-entrancy-guarded: a slow tick is skipped by the next one rather than
 * overlapped (overlap = double sends).
 */
export async function sendDueReminders(now: Date = new Date()): Promise<void> {
  if (running) return;
  running = true;
  try {
    if (!ensureConfigured()) return;

    // A reminder with nothing to reflect on helps no one.
    if ((await getPublishedReflections()).length === 0) return;

    const today = utcDateKey(now);
    const subs = await allSubscriptions();

    for (const sub of subs) {
      if (!dueForSend(sub, now)) continue;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          PAYLOAD,
          { timeout: 10_000 } // a hung endpoint must not stall the loop
        );
        await markSent(sub.id, today);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status !== undefined && PERMANENT_FAILURE.has(status)) {
          await deleteById(sub.id);
          console.log(`[push] pruned dead subscription (${status})`);
        } else {
          // Transient failures (5xx, network, encryption quirks): leave the
          // row; the next tick retries. Log so self-hosters see problems.
          console.warn(
            `[push] send failed (status=${status ?? 'n/a'}): ${(err as Error).message ?? err}`
          );
        }
      }
    }
  } finally {
    running = false;
  }
}
