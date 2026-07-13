import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { admins } from './schema';
import { hashPassword } from '../auth/password';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const [email, passwordArg] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.error('Usage: npm run admin:create -- <email> [password]');
  process.exit(1);
}

const client = postgres(url);
const db = drizzle(client);

async function main() {
  const password = passwordArg ?? randomBytes(12).toString('base64url');
  const passwordHash = await hashPassword(password);

  await db
    .insert(admins)
    .values({ email, passwordHash })
    .onConflictDoUpdate({ target: admins.email, set: { passwordHash } });

  console.log(`Admin ready: ${email}`);
  if (!passwordArg) console.log(`Generated password: ${password}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
