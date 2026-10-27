/**
 * Apply migrations + idempotent seed to the database in DATABASE_URL (Neon).
 * Local PGlite migrates itself on first use, so this is only needed for deploys.
 *   npm run db:migrate
 */
import path from 'path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../lib/db/schema';
import { seed } from '../lib/db/seed';
import type { DB } from '../lib/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('[migrate] DATABASE_URL not set — skipping (local PGlite migrates on first use).');
    return;
  }
  if (typeof WebSocket !== 'undefined') neonConfig.webSocketConstructor = WebSocket;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  await seed(db as unknown as DB);
  await pool.end();
  console.log('[migrate] done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
