import { createHash, randomBytes } from "node:crypto";
import { eq, lte } from "drizzle-orm";
import { db } from "../db/index";
import { admins, sessions, type Admin, type Session } from "../db/schema";

export const SESSION_COOKIE = "ruakh_session";
const SESSION_HOURS = 3;
const HOUR_MS = 3_600_000;

/** The bearer token lives only in the cookie; the DB stores its SHA-256. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function sessionIdFromToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  token: string,
  adminId: number,
): Promise<Session> {
  const session: Session = {
    id: sessionIdFromToken(token),
    adminId,
    expiresAt: new Date(Date.now() + SESSION_HOURS * HOUR_MS),
  };
  await db.insert(sessions).values(session);
  return session;
}

export async function validateSessionToken(
  token: string,
  { renew = false }: { renew?: boolean } = {},
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

  // Sliding renewal: extend the session by 3 hours from now, but ONLY when the
  // caller opts in (`renew`) — i.e. the request is for the admin section. Plain
  // public-facing traffic must never keep an admin session alive. Gated further
  // to within an hour of expiry to avoid a DB write on every admin request.
  if (renew && row.session.expiresAt.getTime() - Date.now() < HOUR_MS) {
    row.session.expiresAt = new Date(Date.now() + SESSION_HOURS * HOUR_MS);
    await db
      .update(sessions)
      .set({ expiresAt: row.session.expiresAt })
      .where(eq(sessions.id, id));
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
