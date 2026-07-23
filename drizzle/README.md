# Migrations

Drizzle migrations. `schema.ts` (`src/lib/server/db/schema.ts`) is the **source of
truth**; the `*.sql` files and `meta/` snapshots are generated from it — don't edit
them by hand.

## Making a schema change

1. Edit `src/lib/server/db/schema.ts` (add/alter a table, column, index, …).
2. `npm run db:generate` — drizzle-kit diffs the schema against the latest snapshot
   in `meta/` and writes a new `NNNN_*.sql` migration + snapshot.
3. `npm run db:migrate` — applies pending migrations. `meta/_journal.json` and the
   `drizzle.__drizzle_migrations` table track what has run, so it's idempotent and
   safe on every deploy (the app image runs `docker/migrate.mjs` on start).
4. `npm run db:seed` fills reflections + the about page (themes are seeded in-schema
   as needed).

## Collation version warning

On startup Postgres may log:

> `WARNING: database "ruakh" has no actual collation version, but a version was
> recorded` (code `01000`, `CheckMyDatabase`)

This means the collation library (glibc/ICU) version recorded when the database
was created no longer matches the one present now — almost always because the
Postgres base image was rebuilt and its `glibc` changed under the existing data
volume. The risk it warns about is that a changed text sort order can invalidate
B-tree indexes on text columns. ruakh's only text indexes are exact-match unique
ones (`admins_email_idx`, `push_subscriptions_endpoint_idx`) and no query relies
on locale-sensitive `ORDER BY text`, so the practical risk here is low.

To clear it, connect to the database and accept the current library version:

```sql
ALTER DATABASE ruakh REFRESH COLLATION VERSION;
REINDEX DATABASE ruakh;  -- belt-and-suspenders for the text indexes
```

**Dev:** simplest to just recreate the volume —
`docker compose -f docker/compose-dev.yml down -v && … up`.

**Production:** run the two statements above deliberately (prod has real data you
don't want to regenerate); don't ignore the warning across a base-image bump.

## History

The migration history was **squashed to a single baseline**
(`0000_baseline.sql`) generated from the current schema, verified to
reproduce the running database exactly. The previously-tracked `0000`–`0004`
migrations (including the hand-authored `0003` rename that had broken the snapshot
chain) were removed. The existing dev database was re-stamped so its
`drizzle.__drizzle_migrations` table records only this baseline; fresh deployments
replay the single baseline to reach the same schema.
