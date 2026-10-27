import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { answerChangeRequest } from '@/lib/account';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/** Answer a guest's change request; the reply (if any) goes to the guest by email/SMS. */
export const POST = guard('bookings', 'full', async (request, staff) => {
  const { id, response } = z.object({ id: z.number().int().positive(), response: z.string().max(2000) }).parse(await request.json());
  const db = await getDb();
  try {
    const r = await answerChangeRequest(db, id, response, staff);
    after(() => deliverQueued(db, { bookingId: r.bookingId }));
    return NextResponse.json(r);
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
});
