/**
 * Storage abstraction:
 * - Vercel production (KV_REST_API_URL set): uses @vercel/kv
 * - Local development (no KV env):          reads/writes JSON files in /data/
 */

const USE_KV = !!process.env.KV_REST_API_URL;

/* ── KV helpers ─────────────────────────────────────────────────────────── */

async function kvRead(key) {
  const { kv } = await import('@vercel/kv');
  return await kv.get(key);
}

async function kvWrite(key, data) {
  const { kv } = await import('@vercel/kv');
  await kv.set(key, data);
}

/* ── File-system helpers ─────────────────────────────────────────────────── */

function fsRead(filename) {
  const fs   = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function fsWrite(filename, data) {
  const fs   = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'data', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/* ── Public API (always async) ───────────────────────────────────────────── */

export async function readJSON(filename) {
  if (USE_KV) return await kvRead(filename);
  return fsRead(filename);
}

export async function writeJSON(filename, data) {
  if (USE_KV) {
    await kvWrite(filename, data);
    return;
  }
  fsWrite(filename, data);
}
