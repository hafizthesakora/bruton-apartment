import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { checkIn, checkOut, frontDeskDay } from '@/lib/booking/frontdesk';
import { todayAtProperty } from '@/lib/booking/pricing';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const cedis = z.coerce.number().min(0).transform((v) => Math.round(v * 100));

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('checkin', 'view', async (request) => {
  const date = new URL(request.url).searchParams.get('date') || todayAtProperty();
  return NextResponse.json(await run(async () => frontDeskDay(await getDb(), date)));
});

const payment = z.object({
  amount: cedis,
  method: z.enum(['cash', 'momo', 'transfer', 'card']),
  reference: z.string().max(80).optional(),
}).optional().transform((p) => (p && p.amount > 0 ? p : undefined));

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('check_in'),
    id: z.number().int(),
    idType: z.string().trim().min(1, 'Choose the ID type').max(40),
    idNumber: z.string().trim().min(3, 'Enter the ID number').max(40),
    nationality: z.string().max(60).optional(),
    keyIssued: z.boolean(),
    securityDeposit: cedis.optional(),
    payment,
  }),
  z.object({
    action: z.literal('check_out'),
    id: z.number().int(),
    keyReturned: z.boolean(),
    securityDepositReturned: cedis.optional(),
    depositNote: z.string().max(500).optional(),
    allowBalance: z.boolean().optional(),
    payment,
  }),
]);

export const POST = guard('checkin', 'full', async (request, staff) => {
  const a = schema.parse(await request.json());
  const db = await getDb();
  const result = await run(async () => (a.action === 'check_in'
    ? checkIn(db, a.id, a, staff)
    : { booking: await checkOut(db, a.id, a, staff), warning: null }));
  after(() => deliverQueued(db, { bookingId: a.id }));
  return NextResponse.json(result);
});
