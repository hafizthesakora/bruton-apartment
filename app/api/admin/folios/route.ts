import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { guard } from '@/lib/auth/staff';
import { folioList } from '@/lib/booking/folios';

export const dynamic = 'force-dynamic';

export const GET = guard('payments', 'view', async (request) => {
  const q = new URL(request.url).searchParams;
  return NextResponse.json(await folioList(await getDb(), { q: q.get('q') ?? undefined, owing: q.get('owing') === '1' }));
});
