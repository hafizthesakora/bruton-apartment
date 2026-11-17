import { beforeAll, describe, expect, it, vi } from 'vitest';
import { testDb } from './helpers';
import type { DB } from '@/lib/db';

const state = vi.hoisted(() => ({ db: null as DB | null }));
vi.mock('@/lib/db', () => ({ getDb: async () => state.db }));
import { readJSON, updateJSON, writeJSON } from '@/lib/data';

beforeAll(async () => { state.db = await testDb(); });

describe('serialized content updates', () => {
  it('preserves concurrent enquiry submissions', async () => {
    await writeJSON('enquiries.json', [{ id: 'original' }]);
    await Promise.all(Array.from({ length: 5 }, (_, index) =>
      updateJSON('enquiries.json', (items: { id: string }[]) => [{ id: String(index) }, ...items]),
    ));
    const items = await readJSON('enquiries.json') as { id: string }[];
    expect(items).toHaveLength(6);
    expect(new Set(items.map((item) => item.id)).size).toBe(6);
  });

  it('rolls back a failed update without changing existing content', async () => {
    await writeJSON('enquiries.json', [{ id: 'keep' }]);
    await expect(updateJSON('enquiries.json', () => { throw new Error('failed'); })).rejects.toThrow('failed');
    expect(await readJSON('enquiries.json')).toEqual([{ id: 'keep' }]);
  });
});
