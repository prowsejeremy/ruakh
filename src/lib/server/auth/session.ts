import { createHash, randomBytes } from 'node:crypto';
import { eq, lte } from 'drizzle-orm';
import { db } from '../db/index';
import { admins, sessions, type Admin, type Session } from '../db/schema';

export const SESSION_COOKIE = 'ruakh_session';
const SESSION_DAYS = 30;
const RENEW_BEFORE_DAYS = 15;

const DAY_MS = 86_400_000;

/** The bearer token lives only in the cookie; the DB stores its SHA-256. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

function sessionIdFromToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(token: string, adminId: number): Promise<Session> {
  const session: Session = {
    id: sessionIdFromToken(token),
    adminId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * DAY_MS)
  };
  await db.insert(sessions).values(session);
  return session;
}

export async function validateSessionToken(
  token: string
): Promise<{ session: Session; admin: Admin } | null> {
  const id = sessionIdFromToken(token);
  const [row] = await db
    .select({ session: sessions, admin: admins })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(eq(sessions.id, id));
  if (!row) return null;

  if (row.session.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  // Sliding renewal: extend when less than half the lifetime remains.
  if (row.session.expiresAt.getTime() - Date.now() < RENEW_BEFORE_DAYS * DAY_MS) {
    row.session.expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
    await db.update(sessions).set({ expiresAt: row.session.expiresAt }).where(eq(sessions.id, id));
  }

  return row;
}

export async function invalidateSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionIdFromToken(token)));
}

/** GC for sessions whose tokens were simply never presented again. */
export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lte(sessions.expiresAt, new Date()));
}
