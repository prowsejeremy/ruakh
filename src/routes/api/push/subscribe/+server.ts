import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { upsertSubscription, deleteByEndpoint } from '$lib/server/push/subscriptions';
import { dueForSend } from '$lib/server/push/schedule';
import { utcDateKey } from '$lib/daily';

/**
 * The one endpoint pair where the server touches user-adjacent data.
 * Payloads are anonymous browser push subscriptions — no identity, no
 * cookies, nothing linkable. See the design spec's privacy principles.
 */

type SubscribeBody = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
  reminderMinute?: unknown;
};

/**
 * The endpoint is attacker-controllable input the server will POST to on a
 * schedule, so validate hard: https only, no IP literals or localhost (SSRF),
 * bounded length (storage abuse).
 */
function validEndpoint(endpoint: string): boolean {
  if (endpoint.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname;
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPv4 literal
  if (host.includes(':') || host.startsWith('[')) return false; // IPv6 literal
  return true;
}

/** Real browser keys decode to exact sizes: p256dh 65 bytes, auth 16 bytes. */
function decodesTo(b64url: string, bytes: number): boolean {
  try {
    return Buffer.from(b64url, 'base64url').length === bytes;
  } catch {
    return false;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as SubscribeBody | null;
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : null;
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : null;
  const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : null;
  const minute = typeof body?.reminderMinute === 'number' ? body.reminderMinute : null;

  if (
    !endpoint ||
    !validEndpoint(endpoint) ||
    !p256dh ||
    !decodesTo(p256dh, 65) ||
    !auth ||
    !decodesTo(auth, 16) ||
    minute === null ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 1439
  ) {
    return json({ error: 'invalid subscription' }, { status: 400 });
  }

  const now = new Date();
  const todayKey = utcDateKey(now);
  // If today's reminder minute already passed, first send is tomorrow —
  // subscribing at 21:00 shouldn't fire this morning's reminder immediately.
  const lastSentOn = dueForSend({ reminderMinute: minute, lastSentOn: null }, now)
    ? todayKey
    : null;

  await upsertSubscription({ endpoint, p256dh, auth, reminderMinute: minute, lastSentOn, todayKey });
  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : null;
  if (!endpoint) return json({ error: 'invalid request' }, { status: 400 });

  await deleteByEndpoint(endpoint);
  return json({ ok: true });
};
