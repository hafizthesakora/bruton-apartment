import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { guestReceipt } from '@/lib/account';
import { guestSessionKey } from '@/lib/account/session';

export const dynamic = 'force-dynamic';

/** GET ?id=<folio entry id> — one of the signed-in guest's payment receipts. */
export const GET = publicRoute(async (request) => {
  const key = await guestSessionKey();
  if (!key) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  return NextResponse.json(await guestReceipt(await getDb(), key, id), { headers: { 'Cache-Control': 'no-store' } });
});
