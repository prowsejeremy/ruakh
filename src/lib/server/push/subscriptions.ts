import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { pushSubscriptions, type PushSubscription } from '../db/schema';

export type NewSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  reminderMinute: number;
  /** Set when the reminder minute already passed today, so the first send is tomorrow. */
  lastSentOn?: string | null;
  /** Today's UTC date key — used to preserve an already-delivered send on upsert. */
  todayKey: string;
};

export async function upsertSubscription(sub: NewSubscription): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      reminderMinute: sub.reminderMinute,
      lastSentOn: sub.lastSentOn ?? null
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: sub.p256dh,
        auth: sub.auth,
        reminderMinute: sub.reminderMinute,
        // If today's reminder was already delivered, keep that fact — a
        // re-register (time change, self-heal sync) must not create a
        // second same-day send.
        lastSentOn: sql`CASE WHEN ${pushSubscriptions.lastSentOn} = ${sub.todayKey} THEN ${pushSubscriptions.lastSentOn} ELSE ${sub.lastSentOn ?? null} END`
      }
    });
}

export async function deleteByEndpoint(endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function deleteById(id: number): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
}

export async function allSubscriptions(): Promise<PushSubscription[]> {
  return db.select().from(pushSubscriptions);
}

export async function markSent(id: number, dateKey: string): Promise<void> {
  await db.update(pushSubscriptions).set({ lastSentOn: dateKey }).where(eq(pushSubscriptions.id, id));
}

/** Aggregate only — Plan 6's admin area shows a count, never rows. */
export async function subscriptionCount(): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(pushSubscriptions);
  return row?.n ?? 0;
}
