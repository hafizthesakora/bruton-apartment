import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { CHANNELS, channelBoard, disconnectFeed, saveFeed, syncFeed } from '@/lib/channel';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function run<T>(fn: () => Promise<T>) {
  try { return await fn(); }
  catch (error) { if (error instanceof BookingError) throw new HttpError(error.status, error.message); throw error; }
}

export const GET = guard('channel', 'view', async () => NextResponse.json(await channelBoard(await getDb()), { headers: { 'Cache-Control': 'no-store' } }));

const body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), apartmentId: z.number().int().positive(), source: z.enum(CHANNELS), url: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal('sync'), id: z.number().int().positive() }),
  z.object({ action: z.literal('disconnect'), id: z.number().int().positive() }),
]);

export const POST = guard('channel', 'full', async (request, staff) => {
  const input = body.parse(await request.json());
  const db = await getDb();
  return run(async () => {
    if (input.action === 'save') return NextResponse.json(await saveFeed(db, input, staff));
    if (input.action === 'sync') return NextResponse.json(await syncFeed(db, input.id));
    await disconnectFeed(db, input.id, staff);
    return NextResponse.json({ ok: true });
  });
});
