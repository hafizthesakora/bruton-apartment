import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import {
  addRatePlan, createApartment, getPolicies, listApartments, makeCoverPhoto, moveApartment, removePhoto,
  setRatePlanActive, updateApartment, updatePolicies, updateRatePlan,
} from '@/lib/apartments';

export const dynamic = 'force-dynamic';

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('rates', 'view', async () => {
  const db = await getDb();
  const [apts, policies] = await Promise.all([listApartments(db), getPolicies(db)]);
  return NextResponse.json({ apartments: apts, policies });
});

const id = z.number().int().positive();
const cedis = z.coerce.number().min(0).transform((v) => Math.round(v * 100));
const optCedis = z.union([z.literal('').transform(() => null), z.null(), cedis]).optional();
const optInt = z.union([z.literal('').transform(() => null), z.null(), z.coerce.number().int()]).optional();
const optDate = z.union([z.literal('').transform(() => null), z.null(), z.string()]).optional();

const apartment = z.object({
  name: z.string().max(80),
  description: z.string().max(4000).optional(),
  maxGuests: z.coerce.number().int(),
  bedrooms: z.coerce.number().int(),
  bathrooms: z.coerce.number().int(),
  amenities: z.array(z.string().max(60)).max(40).optional(),
});
const plan = z.object({
  name: z.string().max(60),
  baseRate: cedis,
  weekendRate: optCedis,
  weekendDays: z.array(z.number().int()).optional(),
  minNights: z.coerce.number().int().optional(),
  longStayMinNights: optInt,
  longStayDiscountPct: optInt,
  validFrom: optDate,
  validTo: optDate,
});

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), apartment }),
  z.object({ action: z.literal('update'), id, apartment: apartment.partial().extend({ active: z.boolean().optional() }) }),
  z.object({ action: z.literal('move'), id, dir: z.union([z.literal(-1), z.literal(1)]) }),
  z.object({ action: z.literal('photo_remove'), photoId: id }),
  z.object({ action: z.literal('photo_cover'), photoId: id }),
  z.object({ action: z.literal('plan_add'), apartmentId: id, plan }),
  z.object({ action: z.literal('plan_update'), planId: id, plan }),
  z.object({ action: z.literal('plan_active'), planId: id, active: z.boolean() }),
  z.object({
    action: z.literal('policies'),
    policies: z.object({
      depositPct: z.coerce.number().int().optional(),
      allowDeposit: z.boolean().optional(),
      allowPayOnArrival: z.boolean().optional(),
      holdMinutes: z.coerce.number().int().optional(),
      freeCancellationDays: z.coerce.number().int().optional(),
      cancellationFeePct: z.coerce.number().int().optional(),
      checkInTime: z.string().optional(),
      checkOutTime: z.string().optional(),
      cancellationText: z.string().max(2000).optional(),
    }),
  }),
]);

export const POST = guard('rates', 'full', async (request, staff) => {
  const a = schema.parse(await request.json());
  const db = await getDb();
  return NextResponse.json(await run(async () => {
    switch (a.action) {
      case 'create': return createApartment(db, a.apartment, staff);
      case 'update': return updateApartment(db, a.id, a.apartment, staff);
      case 'move': await moveApartment(db, a.id, a.dir, staff); return { ok: true };
      case 'photo_remove': await removePhoto(db, a.photoId, staff); return { ok: true };
      case 'photo_cover': await makeCoverPhoto(db, a.photoId, staff); return { ok: true };
      case 'plan_add': return addRatePlan(db, a.apartmentId, a.plan, staff);
      case 'plan_update': return updateRatePlan(db, a.planId, a.plan, staff);
      case 'plan_active': return setRatePlanActive(db, a.planId, a.active, staff);
      case 'policies': return updatePolicies(db, a.policies, staff);
    }
  }));
});
