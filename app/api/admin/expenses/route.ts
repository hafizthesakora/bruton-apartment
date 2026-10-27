import { NextResponse } from 'next/server';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { apartments } from '@/lib/db/schema';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { addExpense, deleteExpense, listExpenses } from '@/lib/expenses';

export const dynamic = 'force-dynamic';

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('expenses', 'view', async (request) => {
  const q = new URL(request.url).searchParams;
  const db = await getDb();
  const [list, apts] = await Promise.all([
    run(() => listExpenses(db, { from: q.get('from') ?? '', to: q.get('to') ?? '', category: q.get('category') || undefined })),
    db.select({ id: apartments.id, name: apartments.name }).from(apartments).orderBy(asc(apartments.sortOrder)).where(eq(apartments.active, true)),
  ]);
  return NextResponse.json({ ...list, apartments: apts });
});

const createSchema = z.object({
  date: z.string(),
  category: z.string().trim().min(1, 'Choose a category').max(60),
  description: z.string().max(300).optional(),
  amount: z.coerce.number().positive('Enter an amount above zero').transform((v) => Math.round(v * 100)),
  apartmentId: z.number().int().positive().nullable().optional(),
});

export const POST = guard('expenses', 'full', async (request, staff) => {
  const input = createSchema.parse(await request.json());
  return NextResponse.json(await run(async () => addExpense(await getDb(), input, staff)), { status: 201 });
});

export const DELETE = guard('expenses', 'full', async (request, staff) => {
  const { id } = z.object({ id: z.number().int().positive() }).parse(await request.json());
  await run(async () => deleteExpense(await getDb(), id, staff));
  return NextResponse.json({ ok: true });
});
