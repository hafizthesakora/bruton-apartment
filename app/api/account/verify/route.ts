import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { verifyCode } from '@/lib/account';
import { startGuestSession } from '@/lib/account/session';

export const dynamic = 'force-dynamic';

export const POST = publicRoute(async (request) => {
  const { contact, code } = z.object({ contact: z.string().max(150), code: z.string().max(10) }).parse(await request.json());
  const key = await verifyCode(await getDb(), contact, code);
  await startGuestSession(key);
  return NextResponse.json({ ok: true });
});
