import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/lib/db/schema';
import { seed } from '@/lib/db/seed';
import type { DB } from '@/lib/db';

/** Fresh in-memory database with all migrations + seed data. */
export async function testDb(): Promise<DB> {
  const client = await PGlite.create({ extensions: { btree_gist } });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  await seed(db);
  return db;
}
