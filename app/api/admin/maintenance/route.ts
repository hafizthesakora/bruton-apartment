import { NextResponse } from 'next/server';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { apartments } from '@/lib/db/schema';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { createTicket, listTickets, updateTicket } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('maintenance', 'view', async (request) => {
  const q = new URL(request.url).searchParams;
  const db = await getDb();
  const [tickets, apts] = await Promise.all([
    listTickets(db, { status: q.get('status') === 'all' ? 'all' : 'open' }),
    db.select({ id: apartments.id, name: apartments.name }).from(apartments).where(eq(apartments.active, true)).orderBy(asc(apartments.sortOrder)),
  ]);
  return NextResponse.json({ tickets, apartments: apts });
});

const priority = z.enum(['low', 'normal', 'urgent']);
const createSchema = z.object({
  apartmentId: z.number().int().positive(),
  title: z.string().trim().min(1, 'Say what needs fixing').max(120),
  description: z.string().max(2000).optional(),
  priority,
  outOfOrder: z.boolean(),
});

export const POST = guard('maintenance', 'full', async (request, staff) => {
  const input = createSchema.parse(await request.json());
  return NextResponse.json(await run(async () => createTicket(await getDb(), input, staff)), { status: 201 });
});

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), id: z.number().int() }),
  z.object({ action: z.literal('reopen'), id: z.number().int() }),
  z.object({ action: z.literal('resolve'), id: z.number().int(), cost: z.coerce.number().min(0).transform((v) => Math.round(v * 100)).optional(), note: z.string().max(500).optional() }),
  z.object({ action: z.literal('edit'), id: z.number().int(), title: z.string().max(120).optional(), description: z.string().max(2000).optional(), priority: priority.optional(), outOfOrder: z.boolean().optional() }),
]);

export const PATCH = guard('maintenance', 'full', async (request, staff) => {
  const { id, ...u } = patchSchema.parse(await request.json());
  return NextResponse.json(await run(async () => updateTicket(await getDb(), id, u, staff)));
});
