import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { staffQuote } from '@/lib/booking/staff';

export const dynamic = 'force-dynamic';

export const GET = guard('bookings', 'view', async (request) => {
  const q = new URL(request.url).searchParams;
  try {
    const total = await staffQuote(await getDb(), Number(q.get('apartmentId')), q.get('checkIn') ?? '', q.get('checkOut') ?? '');
    return NextResponse.json({ total });
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
});
