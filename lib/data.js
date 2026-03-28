/**
 * Storage layer — three-tier strategy:
 *
 *  1. Vercel KV  (KV_REST_API_URL is set)
 *     Reads and writes from @vercel/kv. On first read of a key, if KV
 *     returns null we seed it from the bundled JSON file so you never
 *     start with empty data.
 *
 *  2. Local filesystem  (no KV env, not on Vercel)
 *     Reads and writes /data/*.json directly — the normal dev workflow.
 *
 *  3. Vercel without KV  (VERCEL=1 but no KV_REST_API_URL)
 *     Read-only: serves the bundled JSON. Writes are silently dropped
 *     and the function returns without error so the UI doesn't crash.
 *     Set up Vercel KV to enable writes.
 */

const USE_KV     = !!process.env.KV_REST_API_URL;
const ON_VERCEL  = !!process.env.VERCEL;

import path from 'path';
import fs   from 'fs';

const dataDir = path.join(process.cwd(), 'data');

function readBundled(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
  } catch {
    return null;
  }
}

/* ── KV helpers ─────────────────────────────────────────────────────────── */

async function kvRead(filename) {
  const { kv } = await import('@vercel/kv');
  let value = await kv.get(filename);
  // Auto-seed from bundled file on first use
  if (value === null || value === undefined) {
    const bundled = readBundled(filename);
    if (bundled) {
      await kv.set(filename, bundled);
      return bundled;
    }
  }
  return value ?? null;
}

async function kvWrite(filename, data) {
  const { kv } = await import('@vercel/kv');
  await kv.set(filename, data);
}

/* ── Public API (always async) ───────────────────────────────────────────── */

export async function readJSON(filename) {
  if (USE_KV)    return kvRead(filename);
  return readBundled(filename);          // local dev OR Vercel read-only fallback
}

export async function writeJSON(filename, data) {
  if (USE_KV) {
    await kvWrite(filename, data);
    return;
  }
  if (ON_VERCEL) {
    // No KV configured — log once and return gracefully so the API
    // returns a 200 with { success: true } instead of crashing.
    console.warn(`[data] writeJSON: KV not configured. Set up Vercel KV to persist changes. (${filename})`);
    return;
  }
  // Local filesystem
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2), 'utf8');
}
