/**
 * Site CMS storage — Postgres table `site_content`, one row per former JSON file:
 *   { key: "content.json", data: { ... } }
 *
 * First read of a key that isn't in Postgres yet is seeded from, in order:
 *   1. MongoDB Atlas (if MONGODB_URI is still set) — one-time migration of live edits
 *   2. the bundled JSON file in /data/
 */

import path from 'path';
import fs   from 'fs';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { siteContent } from './db/schema';
import { reviewedContent } from './site-content';

const dataDir = path.join(process.cwd(), 'data');

function bundledRead(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
  } catch {
    return null;
  }
}

async function mongoRead(filename) {
  if (!process.env.MONGODB_URI) return null;
  let client;
  try {
    const { MongoClient } = await import('mongodb');
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const doc = await client.db('bruton').collection('site_data').findOne({ _id: filename });
    return doc?.data ?? null;
  } catch (err) {
    console.error('[data] Mongo migration read failed:', err);
    return null;
  } finally {
    await client?.close().catch(() => {});
  }
}

/* ── Public API (always async) ───────────────────────────────────────────── */

export async function readJSON(filename) {
  const db = await getDb();
  const [row] = await db.select().from(siteContent).where(eq(siteContent.key, filename));
  if (row) return filename === 'content.json' ? reviewedContent(row.data) : row.data;

  const initial = (await mongoRead(filename)) ?? bundledRead(filename);
  if (initial == null) return null;
  await db.insert(siteContent).values({ key: filename, data: initial }).onConflictDoNothing();
  return filename === 'content.json' ? reviewedContent(initial) : initial;
}

export async function writeJSON(filename, data) {
  const db = await getDb();
  await db.insert(siteContent)
    .values({ key: filename, data })
    .onConflictDoUpdate({ target: siteContent.key, set: { data, updatedAt: new Date() } });
}

/** Serialize read/modify/write operations so concurrent enquiries are not lost. */
export async function updateJSON(filename, update) {
  await readJSON(filename);
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.insert(siteContent).values({ key: filename, data: [] }).onConflictDoNothing();
    const [row] = await tx.select().from(siteContent).where(eq(siteContent.key, filename)).for('update');
    const data = update(row.data);
    await tx.update(siteContent).set({ data, updatedAt: new Date() }).where(eq(siteContent.key, filename));
    return data;
  });
}
