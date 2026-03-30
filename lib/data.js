/**
 * Storage layer:
 *  - MONGODB_URI set → MongoDB Atlas (production / Vercel)
 *  - No MONGODB_URI  → local JSON files in /data/ (development)
 *
 * MongoDB schema: one collection "site_data", documents keyed by filename
 *   { _id: "content.json", data: { ... } }
 */

import path from 'path';
import fs   from 'fs';

const USE_MONGO = !!process.env.MONGODB_URI;
const DB_NAME   = 'bruton';
const COLL      = 'site_data';
const dataDir   = path.join(process.cwd(), 'data');

/* ── MongoDB connection (cached across hot-reloads) ─────────────────────── */

let _client = null;

async function getCollection() {
  if (!_client) {
    const { MongoClient } = await import('mongodb');
    _client = new MongoClient(process.env.MONGODB_URI);
    await _client.connect();
  }
  return _client.db(DB_NAME).collection(COLL);
}

/* ── MongoDB helpers ─────────────────────────────────────────────────────── */

async function mongoRead(filename) {
  try {
    const col = await getCollection();
    const doc = await col.findOne({ _id: filename });
    if (doc) return doc.data;
    // First-time: seed from bundled JSON so data is never blank
    const bundled = fsRead(filename);
    if (bundled) {
      await col.replaceOne({ _id: filename }, { _id: filename, data: bundled }, { upsert: true });
      return bundled;
    }
    return null;
  } catch (err) {
    console.error('[data] mongoRead error:', err);
    return fsRead(filename); // graceful fallback
  }
}

async function mongoWrite(filename, data) {
  const col = await getCollection();
  await col.replaceOne({ _id: filename }, { _id: filename, data }, { upsert: true });
}

/* ── Local file-system helpers ───────────────────────────────────────────── */

function fsRead(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
  } catch {
    return null;
  }
}

function fsWrite(filename, data) {
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2), 'utf8');
}

/* ── Public API (always async) ───────────────────────────────────────────── */

export async function readJSON(filename) {
  if (USE_MONGO) return mongoRead(filename);
  return fsRead(filename);
}

export async function writeJSON(filename, data) {
  if (USE_MONGO) {
    await mongoWrite(filename, data);
    return;
  }
  if (process.env.VERCEL) {
    console.warn(`[data] MONGODB_URI not set — changes won't persist on Vercel. (${filename})`);
    return;
  }
  fsWrite(filename, data);
}
