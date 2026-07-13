/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, version } from "$service-worker";

// Unique cache per deployment; activate() removes older ones.
const CACHE = `ruakh-${version}`;
const ASSETS = [...build, ...files];

// Page shells, precached at install so offline works after the FIRST online
// visit (the first navigation happens before the SW controls the page, so it
// would never be runtime-cached). Refreshed network-first on every navigation.
const PAGES = ["/", "/about", "/preferences"];

sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([...ASSETS, ...PAGES]))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      for (const key of keys) {
        if (key !== CACHE) await caches.delete(key);
      }
      await sw.clients.claim();
    }),
  );
});

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== sw.location.origin) return;

  // Precached build/static assets: cache-first (they're immutable per version).
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches
        .open(CACHE)
        .then(
          async (cache) => (await cache.match(url.pathname)) ?? fetch(request),
        ),
    );
    return;
  }

  // Admin pages must never enter the shared runtime cache (auth-gated HTML).
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return;

  // Page navigations: network-first, then the last cached copy of that page,
  // then the cached home page — the daily ritual survives being offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await cache.match(request);
          return cached ?? (await cache.match("/")) ?? Response.error();
        }
      })(),
    );
  }
});

// --- push notifications (Plan 5) --------------------------------------------

sw.addEventListener("push", (event) => {
  let data: { title?: string; body?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    // non-JSON payload: fall back to defaults
  }
  event.waitUntil(
    sw.registration.showNotification(data.title ?? "ruakh", {
      body: data.body ?? "Today’s reflection is waiting.",
      icon: "/app-icons/ruakh.svg",
      badge: "/app-icons/ruakh.svg",
      tag: "ruakh-daily", // delayed deliveries collapse into one gentle nudge
      data: { url: "/" },
    }),
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        // Prefer any open app window: focus it and steer it home.
        const client = clients[0] as WindowClient | undefined;
        if (client) {
          await client.focus().catch(() => {});
          if (new URL(client.url).pathname !== "/" && "navigate" in client) {
            await client.navigate("/").catch(() => {});
          }
          return;
        }
        return sw.clients.openWindow("/");
      }),
  );
});

// The browser rotated the subscription: re-sync the server copy so the daily
// reminder keeps flowing without user action. Known limitation: a rotated
// endpoint re-registers with the default 07:00 UTC minute (the SW can't read
// the on-device preference without extra plumbing); rotation is rare and the
// preferences device screen shows/repairs the effective state.
sw.addEventListener("pushsubscriptionchange", (event) => {
  const e = event as Event & {
    oldSubscription?: PushSubscription | null;
    newSubscription?: PushSubscription | null;
    waitUntil(p: Promise<unknown>): void;
  };
  e.waitUntil(
    (async () => {
      const old = e.oldSubscription;
      const next =
        e.newSubscription ??
        (old?.options
          ? await sw.registration.pushManager
              .subscribe(old.options)
              .catch(() => null)
          : null);
      if (old && !next) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: old.endpoint }),
        }).catch(() => {});
        return;
      }
      if (next) {
        const json = next.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
            reminderMinute: 420,
          }),
        }).catch(() => {});
        if (old && old.endpoint !== next.endpoint) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ endpoint: old.endpoint }),
          }).catch(() => {});
        }
      }
    })(),
  );
});
