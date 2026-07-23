import { building, dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { error, redirect, type Handle } from "@sveltejs/kit";
import { sendDueReminders } from "$lib/server/push/sender";
import {
  ADMIN_GATE_COOKIE,
  ADMIN_GATE_COOKIE_MAX_AGE,
  adminGateDecision,
} from "$lib/server/admin-gate";
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
  if (isAdminPath && !event.locals.admin) {
    // Pre-auth gate: with ADMIN_ACCESS_TOKEN set, visitors without the token
    // (or the door cookie it grants) get the same 404 a missing route gives —
    // the admin section is unprovable from outside. Sessions bypass the gate.
    const gateToken = env.ADMIN_ACCESS_TOKEN;
    const decision = adminGateDecision({
      configuredToken: gateToken,
      queryToken: event.url.searchParams.get("token"),
      cookieToken: event.cookies.get(ADMIN_GATE_COOKIE),
    });
    if (decision === "deny") error(404, "Not found");
    if (decision === "grant") {
      event.cookies.set(ADMIN_GATE_COOKIE, gateToken!, {
        path: "/admin",
        httpOnly: true,
        sameSite: "lax",
        secure: !dev,
        maxAge: ADMIN_GATE_COOKIE_MAX_AGE,
      });
      // Bounce GETs to the same URL minus the token so the secret leaves the
      // address bar (and any URL the login form would later post to).
      if (event.request.method === "GET") {
        const clean = new URL(event.url);
        clean.searchParams.delete("token");
        redirect(303, clean.pathname + clean.search);
      }
    }
    if (path !== "/admin/login") {
      if (event.request.method !== "GET") error(401, "Unauthorized");
      redirect(303, "/admin/login");
    }
  }

  return resolve(event);
};
