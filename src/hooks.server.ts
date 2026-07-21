import { building, dev } from "$app/environment";
import { error, redirect, type Handle } from "@sveltejs/kit";
import { sendDueReminders } from "$lib/server/push/sender";
import {
  SESSION_COOKIE,
  deleteExpiredSessions,
  validateSessionToken,
} from "$lib/server/auth/session";

const TICK_MS = 5 * 60 * 1000;

/**
 * In-process scheduler: one 5-minute tick drives the daily reminders.
 * Restart-safe (the `last_sent_on` column is the once-a-day guard) and
 * dependency-free — fits the one-container self-hosting story. Skipped
 * entirely during prerender/build.
 */
declare global {
  // Survive dev-mode HMR re-evaluation without stacking intervals.
  // eslint-disable-next-line no-var
  var __ruakhPushTimer: ReturnType<typeof setInterval> | undefined;
}

if (!building) {
  if (globalThis.__ruakhPushTimer) clearInterval(globalThis.__ruakhPushTimer);
  globalThis.__ruakhPushTimer = setInterval(() => {
    sendDueReminders().catch((err) =>
      console.error("[push] send tick failed", err),
    );
    deleteExpiredSessions().catch((err) =>
      console.error("[auth] session cleanup failed", err),
    );
  }, TICK_MS);
  // Don't hold the event loop open: adapter-node's SIGTERM handling waits for
  // the loop to drain, and a referenced interval would hang the container
  // until SIGKILL. The HTTP server keeps the process alive in normal use.
  globalThis.__ruakhPushTimer.unref?.();
  process.once("sveltekit:shutdown", () => {
    if (globalThis.__ruakhPushTimer) clearInterval(globalThis.__ruakhPushTimer);
  });
}

/** Resolve the admin session cookie into `locals.admin` (null for visitors). */
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.admin = null;
  const path = event.url.pathname;
  // Only admin-section requests renew the session. Public-facing traffic
  // resolves `locals.admin` but must never slide the expiry forward.
  const isAdminPath = path === "/admin" || path.startsWith("/admin/");

  const token = event.cookies.get(SESSION_COOKIE);
  if (token) {
    const result = await validateSessionToken(token, { renew: isAdminPath });
    if (result) {
      event.locals.admin = { id: result.admin.id, email: result.admin.email };
      // Push the (possibly) renewed expiry to the browser only on admin access,
      // where renewal can have extended it. Public requests never renew, so the
      // cookie is left untouched.
      if (isAdminPath) {
        event.cookies.set(SESSION_COOKIE, token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: !dev,
          expires: result.session.expiresAt,
        });
      }
    } else {
      event.cookies.delete(SESSION_COOKIE, { path: "/" });
    }
  }

  // Central authorization chokepoint. The /admin layout guard only protects
  // page loads — SvelteKit form ACTIONS run before layout loads, so without
  // this every admin mutation would be reachable unauthenticated.
  if (isAdminPath && path !== "/admin/login" && !event.locals.admin) {
    if (event.request.method !== "GET") error(401, "Unauthorized");
    redirect(303, "/admin/login");
  }

  return resolve(event);
};
