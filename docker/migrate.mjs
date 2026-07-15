// Apply pending Drizzle migrations before the server boots.
//
// Uses only the `drizzle-orm` + `postgres` runtime deps and the SQL files in
// ./drizzle — no drizzle-kit / tsx in the production image. Idempotent (the
// __drizzle_migrations table tracks what has run) and retries while Postgres
// finishes starting, so it is safe to run on every container start.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[migrate] DATABASE_URL is not set');
  process.exit(1);
}

const MAX_ATTEMPTS = 30;
const RETRY_MS = 2000;

for (let attempt = 1; ; attempt++) {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql`select 1`;
    await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
    await sql.end();
    console.log('[migrate] ✅ migrations up to date');
    break;
  } catch (err) {
    await sql.end({ timeout: 5 }).catch(() => {});
    if (attempt >= MAX_ATTEMPTS) {
      console.error(`[migrate] failed after ${MAX_ATTEMPTS} attempts:`, err);
      process.exit(1);
    }
    console.log(
      `[migrate] database not ready (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${RETRY_MS}ms...`
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  }
}
