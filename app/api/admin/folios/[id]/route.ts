import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { can } from '@/lib/auth/rbac';
import { BookingError } from '@/lib/booking/engine';
import { addFolioEntry, folioDetail, MANAGER_ONLY } from '@/lib/booking/folios';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const cedis = z.coerce.number().positive('Enter an amount above zero').transform((v) => Math.round(v * 100));
const DESK = ['cash', 'momo', 'transfer', 'card'] as const;

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

async function bookingId(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Booking not found');
  return id;
}

export const GET = guard<Ctx>('payments', 'view', async (_request, _staff, ctx) => {
  const id = await bookingId(ctx);
  return NextResponse.json(await run(async () => folioDetail(await getDb(), id)));
});

const schema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('charge'), description: z.string().trim().min(1, 'Say what the charge is for').max(200), amount: cedis }),
  z.object({ kind: z.literal('payment'), amount: cedis, method: z.enum(DESK), reference: z.string().max(80).optional() }),
  z.object({ kind: z.literal('refund'), amount: cedis, method: z.enum([...DESK, 'paystack']), reference: z.string().max(80).optional(), reason: z.string().trim().min(1, 'Give a reason').max(300) }),
  z.object({ kind: z.literal('adjustment'), amount: cedis, reason: z.string().trim().min(1, 'Give a reason').max(300) }),
]);

export const POST = guard<Ctx>('payments', 'full', async (request, staff, ctx) => {
  const id = await bookingId(ctx);
  const input = schema.parse(await request.json());
  if (MANAGER_ONLY.includes(input.kind) && !can(staff.role, 'refunds', 'full')) {
    throw new HttpError(403, 'Only a manager or the owner can post refunds and adjustments');
  }
  const db = await getDb();
  const entry = await run(() => addFolioEntry(db, id, input, staff));
  if (input.kind === 'payment') after(() => deliverQueued(db, { bookingId: id }));
  return NextResponse.json(entry, { status: 201 });
});
