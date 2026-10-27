import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { accountView } from '@/lib/account';
import { endGuestSession, guestSessionKey } from '@/lib/account/session';

export const dynamic = 'force-dynamic';

/** The signed-in guest's bookings, bills, receipts and requests. 401 when not signed in. */
export const GET = publicRoute(async () => {
  const key = await guestSessionKey();
  if (!key) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json(await accountView(await getDb(), key), { headers: { 'Cache-Control': 'no-store' } });
});

/** Sign out. */
export const DELETE = publicRoute(async () => {
  await endGuestSession();
  return NextResponse.json({ ok: true });
});
