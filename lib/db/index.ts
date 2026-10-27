/**
 * Database client.
 *  - DATABASE_URL set → Neon serverless Postgres (production / preview). Run `npm run db:migrate` on deploy.
 *  - No DATABASE_URL  → embedded PGlite in .data/pglite (local dev). Migrated + seeded automatically.
 */
import fs from 'fs';
import path from 'path';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from './schema';

export type DB = PgliteDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
export { schema };

const g = globalThis as unknown as { __brutonDb?: Promise<DB> };

async function createNeon(): Promise<DB> {
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  if (typeof WebSocket !== 'undefined') neonConfig.webSocketConstructor = WebSocket;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // Same query-builder surface as PGlite; cast so the app has one DB type.
  return drizzle(pool, { schema }) as unknown as DB;
}

async function createPglite(): Promise<DB> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');

  // Vercel's filesystem is read-only outside /tmp — data there won't persist; set DATABASE_URL.
  const dataDir = process.env.VERCEL
    ? '/tmp/pglite'
    : path.join(process.cwd(), '.data', 'pglite');
  if (process.env.VERCEL) console.warn('[db] DATABASE_URL not set — using ephemeral PGlite in /tmp.');

  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = await PGlite.create({ dataDir, extensions: { btree_gist } });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  const { seed } = await import('./seed');
  await seed(db);
  return db;
}

export function getDb(): Promise<DB> {
  if (!g.__brutonDb) {
    g.__brutonDb = (process.env.DATABASE_URL ? createNeon() : createPglite()).catch((err) => {
      g.__brutonDb = undefined;
      throw err;
    });
  }
  return g.__brutonDb;
}
