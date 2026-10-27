import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { guestProfile, mergeGuests, updateGuest } from '@/lib/booking/guests';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

async function guestId(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Guest not found');
  return id;
}

export const GET = guard<Ctx>('guests', 'view', async (_request, _staff, ctx) => {
  const id = await guestId(ctx);
  return NextResponse.json(await run(async () => guestProfile(await getDb(), id)));
});

const patchSchema = z.object({
  fullName: z.string().max(120).optional(),
  email: z.union([z.email('Enter a valid email'), z.literal('')]).optional(),
  phone: z.string().max(32).optional(),
  nationality: z.string().max(60).optional(),
  idType: z.string().max(40).optional(),
  idNumber: z.string().max(40).optional(),
  notes: z.string().max(4000).optional(),
});

export const PATCH = guard<Ctx>('guests', 'full', async (request, staff, ctx) => {
  const id = await guestId(ctx);
  const patch = patchSchema.parse(await request.json());
  return NextResponse.json(await run(async () => updateGuest(await getDb(), id, patch, staff)));
});

/** Merge another guest record into this one. */
export const POST = guard<Ctx>('guests', 'full', async (request, staff, ctx) => {
  const id = await guestId(ctx);
  const { mergeId } = z.object({ mergeId: z.number().int().positive() }).parse(await request.json());
  return NextResponse.json(await run(async () => mergeGuests(await getDb(), id, mergeId, staff)));
});
