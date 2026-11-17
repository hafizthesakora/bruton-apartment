import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import type { DB } from '@/lib/db';
import { staffUsers } from '@/lib/db/schema';
import { signToken } from '@/lib/admin-auth';

const state = vi.hoisted(() => ({ db: null as DB | null, token: '' }));
vi.mock('@/lib/db', () => ({ getDb: async () => state.db }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => state.token ? { value: state.token } : undefined }) }));

import { GET as content } from '@/app/api/admin/content/route';
import { GET as settings, PUT as saveSettings } from '@/app/api/admin/settings/route';
import { GET as enquiries } from '@/app/api/admin/enquiries/route';
import { GET as carousel } from '@/app/api/admin/carousel/route';
import { POST as upload } from '@/app/api/admin/upload/route';

const request = () => new Request('http://localhost/api/admin/settings', {
  method: 'PUT', body: JSON.stringify({ siteName: 'Updated' }),
});

beforeAll(async () => { state.db = await testDb(); });
beforeEach(async () => {
  state.token = '';
  await state.db!.update(staffUsers).set({ active: true, role: 'owner' }).where(eq(staffUsers.id, 1));
});

describe('legacy admin route authorization', () => {
  it('blocks unauthenticated access even without middleware', async () => {
    for (const handler of [content, settings, enquiries, carousel, upload]) {
      expect((await handler(request(), undefined)).status).toBe(401);
    }
  });

  it('rejects a deactivated staff member with an otherwise valid token', async () => {
    state.token = await signToken({ sub: '1', role: 'owner' });
    await state.db!.update(staffUsers).set({ active: false }).where(eq(staffUsers.id, 1));
    expect((await content(request(), undefined)).status).toBe(401);
  });

  it('uses the current role rather than the stale role in the token', async () => {
    state.token = await signToken({ sub: '1', role: 'owner' });
    await state.db!.update(staffUsers).set({ role: 'manager' }).where(eq(staffUsers.id, 1));
    expect((await settings(request(), undefined)).status).toBe(200);
    expect((await saveSettings(request(), undefined)).status).toBe(403);
  });
});
