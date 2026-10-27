import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { submitChangeRequest } from '@/lib/account';
import { guestSessionKey } from '@/lib/account/session';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/** A guest asks the front desk for a change to one of their bookings. */
export const POST = publicRoute(async (request) => {
  const key = await guestSessionKey();
  if (!key) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  const { bookingId, message } = z.object({ bookingId: z.number().int().positive(), message: z.string().max(1000, 'Please keep it under 1,000 characters') }).parse(await request.json());
  const db = await getDb();
  const r = await submitChangeRequest(db, key, bookingId, message);
  after(() => deliverQueued(db, { bookingId }));
  return NextResponse.json(r, { status: 201 });
});
