# Migrations

Applied with `npm run db:migrate` (SQL files + `meta/_journal.json`). Verified to
apply cleanly on both an existing dev DB and a fresh database; `npm run db:seed`
then fills quotes + the about page (themes are seeded by migration 0003).

## Known follow-up: snapshot re-baseline before the next `db:generate`

`0003_admin_refinement.sql` was **hand-authored** (drizzle-kit's generator needs
an interactive TTY to resolve the `content_blocks` → `pages` table rename, which
isn't available here). Because of that, there is **no `meta/0003_snapshot.json`**.

Consequence: the next `drizzle-kit generate` will diff the schema against the
stale `0002_snapshot.json` and emit a bogus migration. It fails *loudly* at apply
time ("relation already exists") — it does not silently corrupt data — but it must
be re-baselined before doing any further schema work.

**To re-baseline (do this interactively at the next schema change):** squash the
history into a single baseline that matches the current schema — delete the
`*.sql` files + `meta/*`, run `drizzle-kit generate` (no prior state → no rename
prompt → produces a correct baseline + snapshot), then re-stamp any already-migrated
database's `drizzle.__drizzle_migrations` so `migrate` treats the baseline as
applied. Since nothing here is committed yet and fresh deployments have no data to
preserve, a squashed baseline is the clean end state.
