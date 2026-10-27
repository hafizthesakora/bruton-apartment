import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { listSlots } from '@/lib/viewings';

export const dynamic = 'force-dynamic';

export const GET = publicRoute(async (request) => {
  const date = new URL(request.url).searchParams.get('date') ?? '';
  const slots = await listSlots(await getDb(), date);
  return NextResponse.json({ date, slots }, { headers: { 'Cache-Control': 'no-store' } });
});
