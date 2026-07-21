# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ruakh** is a personal daily-reflection PWA: one reflection per day, installable,
fully offline-capable, anonymous daily push reminder, private admin CMS. Self-hosts
as a **single container** — SvelteKit 2 · Svelte 5 (runes) · `adapter-node` ·
Postgres via **Drizzle ORM** · `idb` (IndexedDB) · `web-push` · Vitest.

**Commands:** `npm run dev` (or `docker compose -f docker/compose-dev.yml up`) ·
`test:unit` · `check` · DB `db:generate`/`db:migrate`/`db:seed`/`admin:create`
(schema.ts is the migration source of truth — see [drizzle/README.md](drizzle/README.md)).

### Key mechanics (the non-obvious *why*)

- **Daily pick is computed, not stored.** `selectDailyReflection` = `dayNumber(date)
  % length` over a stable order (published, oldest-first by `createdAt,id`). No
  schedule table; server SSR and offline client run the *same pure function over the
  same order*, agreeing day-for-day. Editing the published set reshuffles the
  date→reflection mapping — accepted by design.
- **Offline engine.** `/api/content/bundle` serves all public content with a **strong
  ETag = content hash** (excludes `generatedAt`); the client caches it in IndexedDB
  and revalidates with `If-None-Match`, so **bytes transfer only when an admin edits**.
  This cache is what lets the device recompute today's pick offline.
- **Home stale-override.** `/` SSRs today's pick, then on mount replaces it with a
  locally recomputed one if the served page was stale (offline, or SW-cached past UTC
  midnight), recording history under the UTC day that selected it.
- **`ReflectionView` is the only client-facing shape** — `toReflectionView` drops
  server-only fields (e.g. `copyright`) and pre-parses each section into
  `ContentBlock[]` (one slide per section). Routes/components never see raw rows.
- **Privacy boundary:** two IndexedDB DBs — `ruakh-content` (disposable public cache)
  vs `ruakh` (favorites + history, which **never leave the device**; records snapshot
  full content so they survive upstream edits).
- **`hooks.server.ts` is the central authz chokepoint** — it must guard all `/admin`
  non-GET requests, because SvelteKit form actions run *before* layout loads (the
  `/admin` layout guard alone is insufficient).
- **Admin account self-edit is ownership-guarded per action.** The chokepoint
  only proves *authentication*; `/admin/users/[id]` additionally rejects editing
  anyone else's account — its `load` and both actions (`updateEmail`,
  `changePassword`) compare `params.id` to `locals.admin.id` and `error(403)`
  otherwise. `changePassword` re-verifies the current password
  (`verifyPassword`) and leaves the current session valid; email changes need
  only the authenticated session. Create-user requires an operator-supplied
  password (min 12 chars); the "Generate" button fills a 24-char one client-side
  and the reveal screen shows **only** for generated passwords (a typed one is
  already known). Password length min (12) is enforced server-side, not just via
  the input's `minlength`.
- **Push scheduler is in-process:** a 5-min `setInterval` in `hooks.server.ts` drives
  `sendDueReminders()` + session GC (no cron/queue). `lastSentOn` is a restart-safe
  once-a-day guard with late catch-up; dead endpoints self-prune; timer is `unref()`'d
  for clean SIGTERM. Sessions are Lucia-pattern (cookie holds token, DB stores its
  SHA-256; absolute 3-hour cap set at login, no sliding renewal — re-auth
  required after 3 hours). `push_subscriptions` is the only user-adjacent
  server data — anonymous.
- **Theming:** admin-managed DB rows; picked theme snapshotted to
  `localStorage('ruakh:theme')` and applied by an inline **pre-paint script in
  [src/app.html](src/app.html)** (no flash). ⚠️ CSP caveat noted there — use
  SvelteKit's `csp` config, not a bare `script-src` header, or flash-prevention breaks.
- **Service worker** precaches assets + page shells at install; assets cache-first,
  navigations network-first → cached page → cached `/`; admin HTML never cached.
- **Import convention (load-bearing):** modules run under Vitest (no SvelteKit
  aliases) use **relative** imports (`client/storage.ts`, `push/schedule.ts`,
  `push/sender.ts`); server/route code uses `$lib`. Pure/testable logic lives in small
  modules with `.test.ts` siblings — prefer this shape for new logic.

### Routes & admin CMS actions

Public/visitor:

| Route | Load / behaviour |
|---|---|
| `/` | SSRs today's pick; client overrides with offline recompute + records history |
| `/reflections/[id]` | Single reflection, **published-only** (404s drafts so ids can't be enumerated); `cache-control: no-cache` |
| `/[uri]` | DB-backed markdown pages (e.g. `/about`); 404 if missing; `no-cache` |
| `/preferences`, `/preferences/{device,history,saved,theme}` | Client-only device settings (mostly no server load; `theme` has one for SSR themes) |

Admin CMS — every route under `/admin` is session-gated (except `/admin/login`);
mutations are SvelteKit **form actions** (named), authorized by `hooks.server.ts`:

| Route | Actions |
|---|---|
| `/admin` | `load` (dashboard), `logout` |
| `/admin/login` | `default` (authenticate) |
| `/admin/reflections`, `.../new`, `.../[id]` | list · `create` · `update` + `delete` |
| `/admin/pages`, `.../new`, `.../[uri]` | list · `create` · `update` + `delete` |
| `/admin/themes`, `.../new`, `.../[id]` | list · `create` · `update` + `delete` |
| `/admin/users`, `.../new`, `.../[id]` | list + `delete` · `create` · **self-edit** (`updateEmail` + `changePassword`) |

API endpoints (`+server.ts`):
- `GET /api/content/bundle` — offline content bundle (ETag/304, above).
- `POST` / `DELETE /api/push/subscribe` — register / remove a push subscription
  (also called by the service worker on subscription rotation).

### File map

Shared library (`src/lib/`):

| File | Purpose / key exports |
|---|---|
| `types.ts` | `ReflectionView` — the one client-facing reflection shape |
| `daily.ts` | `dayNumber`, `utcDateKey`, `selectDailyReflection` (the daily algorithm) |
| `markdown.ts` | markdown-lite: `parseContent`→`ContentBlock[]`, `blocksToHtml`, `blocksToText` |
| `markdown-help.ts` | `MARKDOWN_EXAMPLES`, `examplePreview` (admin help) |
| `bundle-hash.ts` | `hashBundle` (server-only content hash for the bundle ETag) |
| `format.ts` | `formatAttribution` ("Attribution; Source") |
| `push-time.ts` | `toUtcMinute`, `minuteOfDayUtc` (local↔UTC reminder math) |
| `themes.ts` | `Theme` type, `FALLBACK_THEME` |
| `pattern.ts` | pure geometry for `PatternBackground` (chords/coverage/interpolation) |
| `transitions.ts` | `reveal` staggered transition + `resolveStaggerOrder` |
| `client/theme.ts` | `loadTheme`/`applyTheme`/`saveTheme`/`hexToRgb` (localStorage `ruakh:theme`) |
| `client/storage.ts` | private IndexedDB `ruakh`: favorites + history (never leaves device) |
| `client/content.ts` | public IndexedDB `ruakh-content`: bundle cache + conditional refresh |
| `client/push.ts` | browser push plumbing (`enableReminder`/`disableReminder`/…); never throws |
| `client/install.svelte.ts` | `installState` — captures `beforeinstallprompt` early |
| `client/password.ts` | `randomPassword(len=24)` — `A–Z a–z 0–9` generator for the admin create-user "Generate" button (client-side) |
| `client/intro.svelte.ts` | `intro.done` — shared splash-complete flag |

Server (`src/lib/server/`):

| File | Purpose |
|---|---|
| `db/index.ts` | Drizzle/postgres singleton (`db`); throws if `DATABASE_URL` unset |
| `db/schema.ts` | table defs + inferred types — **migration source of truth** |
| `db/{reflections,pages,themes}.ts` | query modules; `reflections` also has `toReflectionView` |
| `db/seed.ts`, `db/create-admin.ts` | `npm run db:seed`, `npm run admin:create` scripts |
| `content-bundle.ts` | `buildContentBundle` — assembles the offline bundle |
| `validation.ts` | `pageUriError`, `isHexColor` (form input checks) |
| `auth/{password,session}.ts` | scrypt hashing (`scrypt:<salt>:<hash>`); Lucia-pattern sessions |
| `push/{sender,schedule,subscriptions}.ts` | `sendDueReminders`, `dueForSend`, subscription CRUD |

Top-level (`src/`): `hooks.server.ts` (authz chokepoint + push/session interval) ·
`service-worker.ts` (offline caching + push display/click + subscription rotation) ·
`app.html` (pre-paint theme script) · `routes/` (above).

Components (`src/lib/components/`): `ReflectionScreen` (daily slides display) ·
`Actions` (favorite/save bar, uses `storage.ts`) · `IntroScreen` (splash w/ morphing
wordmark) · `LoadingScreen` · `Logo` · `Icon` · `BackButton` · `Reveal` (wraps
`transitions.reveal`) · `PatternBackground` (animated line bg, uses `pattern.ts`) ·
`InstallHint` (PWA install) · `Toggle` (checkbox switch) · `admin/ReflectionForm`
(shared create/edit form) · `admin/MarkdownHelp`.

Assets: `Icon` inlines `static/icons/*` (currentColor), `Logo` imports
`ruakh-logo.svg?raw`; `static/{icons,app-icons,fonts}/` + `manifest.webmanifest`;
styles `src/lib/styles/{app,fonts,panel}.css` and PT-Serif fonts loaded in the root layout.

### Environment

`.env` (copy from `.env.example`; `db/index.ts` requires it):
- `DATABASE_URL` — Postgres connection (required).
- `PUBLIC_VAPID_KEY` / `PRIVATE_VAPID_KEY` / `VAPID_SUBJECT` — web-push. **Optional in
  dev**: absent keys leave the reminder scheduler idle (`ensureConfigured` returns false).

Deploy/runtime: the production image runs [docker/migrate.mjs](docker/migrate.mjs) on
start (applies pending migrations with runtime deps only — no drizzle-kit/tsx),
then boots. See [docker/](docker/) (`compose.yml`, `compose-dev.yml`, `Dockerfile`)
and [deploy/](deploy/) (self-host scripts).

## Git

**Never run git-writing commands** (`git commit`, `git add`, `git push`, `git
merge`, `git rebase`, etc.) in this project — the user handles all git operations
themselves. Make and edit files freely; leave staging and committing to the user.
Read-only git commands (`git status`, `git diff`, `git log`, `git show`) are fine.

## Process right-sizing

Match the weight of the process to the size of the task. Size the task first, then pick the lightest process that fits — do not pick a process and fit the task to it.

- **Targeted fixes** (≲1–2 files of net-new logic, or where a written plan would mostly just restate the code): implement directly in-session with TDD. No spec doc, no plan doc, no per-task subagents. A quick brainstorm to confirm intent and 1–2 clarifying questions are fine and often worth it — the ceremony to skip is the formal docs and the dispatch/review/verify loop, not the thinking.
- **Genuinely large or parallelizable features** (many files, independent subsystems, work that won't fit one context): use the full brainstorm → spec → plan → subagent-driven pipeline.
- When offering the user an execution style, right-size the recommendation. Do not default to subagent-driven execution for small, pre-specified, or mostly-sequential work — for those the subagents are pure overhead (and re-typing code that a plan already spells out verbatim is double work).
- If unsure, ask "does this actually need the full pipeline?" **before** starting it, not after.
- The user may override per-task with an effort signal (e.g. "implement directly, no plan/subagents" / "thin process" / "full process"). Those instructions win.

## Dispatching subagents

When dispatching a subagent (Agent tool, any `subagent_type`), the dispatch prompt **MUST** include the four sections below. A subagent that decides on its own to run `npm install`, `mkdir`, `chmod`, or any setup/scaffolding command is a dispatch failure — give it less room.

### 1. Concrete allowlist of tools and commands

Spell out _exactly_ what the subagent will use. Don't say "use the appropriate tools." Say:

> You will use only: `Read` and `Edit` on the files listed in the task; `Bash` only for the exact commands listed below; `git add`/`git commit` only for the files listed.
> Allowed Bash commands for this task:
>
> - `npm test -- src/lib/store-finder`
> - `git add <listed files>`
> - `git commit -m "…"`

### 2. Concrete denylist

> Do NOT run: `npm install`, `npm ci`, any `npx` install, `mkdir`, `chmod`, `touch`, `tsc` directly, or any script not listed above. Do NOT create files outside those listed in the task. Do NOT run setup, scaffolding, or "verification" commands the task did not ask for.
>
> The repo is already installed — `node_modules` exists. If a command appears to need install, **stop and report BLOCKED**, don't install.

### 3. "Stop and ask, don't improvise" clause

> If anything the task tells you to do appears to require a tool or command outside the allowlist, **STOP and report NEEDS_CONTEXT**. Do not improvise setup steps. Do not fix problems the task didn't ask you to fix.

### 4. Scope guardrail for unrelated dirty state

If the working tree has unstaged changes in files outside the task's scope (common during iterative work):

> The working tree contains unstaged changes in unrelated files. DO NOT stage, touch, or revert any file not explicitly listed in this task. Stage only: `<exact list>`.

### Implementation-task default allowlist

Most implementation tasks in this repo need only:

- `Read`, `Edit`, `Write` (Write only for _new_ files explicitly listed)
- `Bash` for: `npm test [--…]`, `npm run lint`, `npm run build` (only if task says so), `git status`, `git diff`, `git add <listed files>`, `git commit -m "…"`, `git log`, `git show`

If the task needs anything else (a migration, a generator, a script run), the dispatch prompt names it explicitly.

### Why this matters

Subagents that pad their work with self-directed setup commands generate permission prompts the user has to triage, hide the actual task progress behind unrelated activity, and occasionally do destructive things the plan never asked for. Tight scope per dispatch keeps the loop fast and predictable.
