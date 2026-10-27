import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getBookingForGuest } from '@/lib/booking/engine';
import { publicRoute } from '@/lib/booking/http';

export const dynamic = 'force-dynamic';

/** Booking status for the guest's confirmation page. References are random, so this exposes no list. */
export const GET = publicRoute<{ params: Promise<{ reference: string }> }>(async (_request, { params }) => {
  const { reference } = await params;
  if (!/^BG[A-Z0-9]{6}$/i.test(reference)) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  const booking = await getBookingForGuest(await getDb(), reference);
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  return NextResponse.json(booking, { headers: { 'Cache-Control': 'no-store' } });
});
