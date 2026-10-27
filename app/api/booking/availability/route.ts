import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getPolicy, searchAvailability } from '@/lib/booking/engine';
import { paymentOptions } from '@/lib/booking/pricing';
import { publicRoute } from '@/lib/booking/http';
import { paystackEnabled } from '@/lib/payments/paystack';

export const dynamic = 'force-dynamic';

const query = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().min(1).max(20).default(1),
});

export const GET = publicRoute(async (request) => {
  const q = query.parse(Object.fromEntries(new URL(request.url).searchParams));
  const db = await getDb();
  const [apartments, policy] = await Promise.all([searchAvailability(db, q), getPolicy(db)]);
  return NextResponse.json({
    apartments,
    paymentOptions: paymentOptions(policy, paystackEnabled()),
    policy: {
      depositPct: policy.depositPct,
      holdMinutes: policy.holdMinutes,
      checkInTime: policy.checkInTime,
      checkOutTime: policy.checkOutTime,
      cancellationText: policy.cancellationText,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
});
