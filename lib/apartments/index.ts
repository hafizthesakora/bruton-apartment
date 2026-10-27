/**
 * Apartments & rates — the units guests book, their photos, nightly rate plans and the
 * booking policies (deposit, pay on arrival, cancellation, check-in/out times).
 *
 * Rate plans: an open-ended plan covers every night; a dated (seasonal) plan overrides it
 * for its dates (see planForDate in lib/booking/pricing.ts). Plans are deactivated, not
 * deleted, so past quotes stay explainable.
 */
import { and, asc, eq, gte, inArray, max, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { apartmentPhotos, apartments, bookings, housekeepingStatus, policies, ratePlans } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from '@/lib/booking/engine';
import { isISODate, todayAtProperty } from '@/lib/booking/pricing';

type Actor = { id: number; name: string };

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56) || 'apartment';

/* ── Apartments ────────────────────────────────────────────────────────── */

export async function listApartments(db: DB) {
  const [apts, photos, plans, upcoming] = await Promise.all([
    db.select().from(apartments).orderBy(asc(apartments.sortOrder), asc(apartments.id)),
    db.select().from(apartmentPhotos).orderBy(asc(apartmentPhotos.sortOrder), asc(apartmentPhotos.id)),
    db.select().from(ratePlans).orderBy(asc(ratePlans.validFrom), asc(ratePlans.id)),
    db.select({ apartmentId: bookings.apartmentId, n: sql<number>`count(*)::int` }).from(bookings)
      .where(and(inArray(bookings.status, ['held', 'pending_payment', 'confirmed', 'checked_in']), gte(bookings.checkOut, todayAtProperty())))
      .groupBy(bookings.apartmentId),
  ]);
  const today = todayAtProperty();
  return apts.map((a) => {
    const own = plans.filter((p) => p.apartmentId === a.id);
    return {
      ...a,
      photos: photos.filter((p) => p.apartmentId === a.id),
      ratePlans: own,
      upcomingBookings: Number(upcoming.find((u) => u.apartmentId === a.id)?.n ?? 0),
      // Without an open-ended plan, any night outside the seasonal plans can't be priced or booked.
      missingBaseRate: !own.some((p) => p.active && !p.validFrom && !p.validTo),
      expiredPlans: own.filter((p) => p.active && p.validTo && p.validTo < today).length,
    };
  });
}

export type ApartmentInput = {
  name: string; description?: string; maxGuests: number; bedrooms: number; bathrooms: number; amenities?: string[];
};

function checkApartment(a: Partial<ApartmentInput>) {
  if (a.name !== undefined && !a.name.trim()) throw new BookingError(400, 'Give the apartment a name');
  for (const k of ['maxGuests', 'bedrooms', 'bathrooms'] as const) {
    const v = a[k];
    if (v !== undefined && (!Number.isInteger(v) || v < (k === 'maxGuests' ? 1 : 0) || v > 30)) throw new BookingError(400, `Check the ${k === 'maxGuests' ? 'guest limit' : k}`);
  }
}

const cleanAmenities = (list?: string[]) => list ? [...new Set(list.map((s) => s.trim()).filter(Boolean))].slice(0, 40) : undefined;

/** New apartments start inactive with no rates, so they can't be booked half set up. */
export async function createApartment(db: DB, input: ApartmentInput, actor: Actor) {
  checkApartment(input);
  return db.transaction(async (tx) => {
    const base = slugify(input.name);
    const taken = new Set((await tx.select({ slug: apartments.slug }).from(apartments)).map((r) => r.slug));
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    const [{ last }] = await tx.select({ last: max(apartments.sortOrder) }).from(apartments);
    const [apt] = await tx.insert(apartments).values({
      slug, name: input.name.trim(), description: input.description?.trim() ?? '', maxGuests: input.maxGuests,
      bedrooms: input.bedrooms, bathrooms: input.bathrooms, amenities: cleanAmenities(input.amenities) ?? [],
      sortOrder: (last ?? -1) + 1, active: false,
    }).returning();
    await tx.insert(housekeepingStatus).values({ apartmentId: apt.id, status: 'clean' }).onConflictDoNothing();
    await audit(actor, 'apartment', apt.id, 'create', { name: apt.name }, tx);
    return apt;
  });
}

export async function updateApartment(db: DB, id: number, patch: Partial<ApartmentInput> & { active?: boolean }, actor: Actor) {
  checkApartment(patch);
  return db.transaction(async (tx) => {
    const [a] = await tx.select().from(apartments).where(eq(apartments.id, id));
    if (!a) throw new BookingError(404, 'Apartment not found');

    if (patch.active === false && a.active) {
      const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(bookings)
        .where(and(eq(bookings.apartmentId, id), inArray(bookings.status, ['held', 'pending_payment', 'confirmed', 'checked_in']), gte(bookings.checkOut, todayAtProperty())));
      if (Number(n) > 0) throw new BookingError(409, `${a.name} has ${n} upcoming booking${Number(n) === 1 ? '' : 's'} — move or cancel them before hiding it`);
    }
    if (patch.active === true && !a.active) {
      const plans = await tx.select().from(ratePlans).where(and(eq(ratePlans.apartmentId, id), eq(ratePlans.active, true)));
      if (!plans.some((p) => !p.validFrom && !p.validTo)) throw new BookingError(400, 'Add a standard (all-year) rate before opening this apartment for booking');
    }

    const set = {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
      ...(patch.maxGuests !== undefined ? { maxGuests: patch.maxGuests } : {}),
      ...(patch.bedrooms !== undefined ? { bedrooms: patch.bedrooms } : {}),
      ...(patch.bathrooms !== undefined ? { bathrooms: patch.bathrooms } : {}),
      ...(patch.amenities !== undefined ? { amenities: cleanAmenities(patch.amenities)! } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
    };
    const [updated] = await tx.update(apartments).set(set).where(eq(apartments.id, id)).returning();
    await audit(actor, 'apartment', id, 'update', { fields: Object.keys(set), ...(patch.active !== undefined ? { active: patch.active } : {}) }, tx);
    return updated;
  });
}

/** Move an apartment up or down the list (the order guests see). */
export async function moveApartment(db: DB, id: number, dir: -1 | 1, actor: Actor) {
  return db.transaction(async (tx) => {
    const list = await tx.select({ id: apartments.id }).from(apartments).orderBy(asc(apartments.sortOrder), asc(apartments.id));
    const i = list.findIndex((a) => a.id === id);
    const j = i + dir;
    if (i < 0) throw new BookingError(404, 'Apartment not found');
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    for (const [k, a] of list.entries()) await tx.update(apartments).set({ sortOrder: k }).where(eq(apartments.id, a.id));
    await audit(actor, 'apartment', id, 'reorder', { to: j }, tx);
  });
}

/* ── Photos ────────────────────────────────────────────────────────────── */

export async function addPhoto(db: DB, apartmentId: number, url: string, alt: string, actor: Actor) {
  const [{ last }] = await db.select({ last: max(apartmentPhotos.sortOrder) }).from(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, apartmentId));
  const [p] = await db.insert(apartmentPhotos).values({ apartmentId, url, alt: alt.trim(), sortOrder: (last ?? -1) + 1 }).returning();
  await audit(actor, 'apartment', apartmentId, 'photo_add', { photoId: p.id }, db);
  return p;
}

export async function removePhoto(db: DB, photoId: number, actor: Actor) {
  const [p] = await db.delete(apartmentPhotos).where(eq(apartmentPhotos.id, photoId)).returning();
  if (!p) throw new BookingError(404, 'Photo not found');
  await audit(actor, 'apartment', p.apartmentId, 'photo_remove', { photoId, url: p.url }, db);
}

/** Make this photo the first one guests see. */
export async function makeCoverPhoto(db: DB, photoId: number, actor: Actor) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(apartmentPhotos).where(eq(apartmentPhotos.id, photoId));
    if (!p) throw new BookingError(404, 'Photo not found');
    const rest = (await tx.select({ id: apartmentPhotos.id }).from(apartmentPhotos)
      .where(eq(apartmentPhotos.apartmentId, p.apartmentId)).orderBy(asc(apartmentPhotos.sortOrder), asc(apartmentPhotos.id)))
      .filter((r) => r.id !== photoId);
    await tx.update(apartmentPhotos).set({ sortOrder: 0 }).where(eq(apartmentPhotos.id, photoId));
    for (const [k, r] of rest.entries()) await tx.update(apartmentPhotos).set({ sortOrder: k + 1 }).where(eq(apartmentPhotos.id, r.id));
    await audit(actor, 'apartment', p.apartmentId, 'photo_cover', { photoId }, tx);
  });
}

/* ── Rate plans ────────────────────────────────────────────────────────── */

export type RatePlanInput = {
  name: string; baseRate: number; weekendRate?: number | null; weekendDays?: number[];
  minNights?: number; longStayMinNights?: number | null; longStayDiscountPct?: number | null;
  validFrom?: string | null; validTo?: string | null;
};

function checkPlan(p: RatePlanInput) {
  if (!p.name.trim()) throw new BookingError(400, 'Name the rate (e.g. Standard, Christmas)');
  if (!(p.baseRate > 0)) throw new BookingError(400, 'Enter a nightly rate above zero');
  if (p.weekendRate != null && p.weekendRate <= 0) throw new BookingError(400, 'Weekend rate must be above zero, or left blank');
  if (p.minNights != null && (!Number.isInteger(p.minNights) || p.minNights < 1 || p.minNights > 90)) throw new BookingError(400, 'Minimum stay must be 1–90 nights');
  if (p.weekendDays && p.weekendDays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) throw new BookingError(400, 'Check the weekend nights');
  const hasDiscount = p.longStayDiscountPct != null && p.longStayDiscountPct > 0;
  if (hasDiscount && (p.longStayDiscountPct! > 90 || !p.longStayMinNights || p.longStayMinNights < 2)) {
    throw new BookingError(400, 'A long-stay discount needs a minimum of 2+ nights and at most 90%');
  }
  for (const d of [p.validFrom, p.validTo]) if (d && !isISODate(d)) throw new BookingError(400, 'Check the season dates');
  if ((p.validFrom && !p.validTo) || (!p.validFrom && p.validTo)) throw new BookingError(400, 'A seasonal rate needs both a start and an end date');
  if (p.validFrom && p.validTo && p.validTo < p.validFrom) throw new BookingError(400, 'The season ends before it starts');
}

function planValues(p: RatePlanInput) {
  const hasDiscount = p.longStayDiscountPct != null && p.longStayDiscountPct > 0;
  return {
    name: p.name.trim(), baseRate: p.baseRate, weekendRate: p.weekendRate ?? null,
    ...(p.weekendDays ? { weekendDays: [...new Set(p.weekendDays)].sort() } : {}),
    minNights: p.minNights ?? 1,
    longStayMinNights: hasDiscount ? p.longStayMinNights! : null,
    longStayDiscountPct: hasDiscount ? p.longStayDiscountPct! : null,
    validFrom: p.validFrom || null, validTo: p.validTo || null,
  };
}

/** Two active plans of the same kind covering the same night would make the price ambiguous. */
async function checkOverlap(db: DB, apartmentId: number, p: RatePlanInput, exceptId?: number) {
  const others = (await db.select().from(ratePlans).where(and(eq(ratePlans.apartmentId, apartmentId), eq(ratePlans.active, true))))
    .filter((o) => o.id !== exceptId);
  if (!p.validFrom) {
    if (others.some((o) => !o.validFrom)) throw new BookingError(409, 'This apartment already has a standard rate — edit that one, or give this rate season dates');
    return;
  }
  const clash = others.find((o) => o.validFrom && o.validTo && o.validFrom <= p.validTo! && p.validFrom! <= o.validTo);
  if (clash) throw new BookingError(409, `These dates overlap the “${clash.name}” rate (${clash.validFrom} to ${clash.validTo})`);
}

export async function addRatePlan(db: DB, apartmentId: number, input: RatePlanInput, actor: Actor) {
  checkPlan(input);
  const [apt] = await db.select({ id: apartments.id }).from(apartments).where(eq(apartments.id, apartmentId));
  if (!apt) throw new BookingError(404, 'Apartment not found');
  await checkOverlap(db, apartmentId, input);
  const [p] = await db.insert(ratePlans).values({ apartmentId, ...planValues(input) }).returning();
  await audit(actor, 'rate_plan', p.id, 'create', { apartmentId, ...planValues(input) }, db);
  return p;
}

export async function updateRatePlan(db: DB, id: number, input: RatePlanInput, actor: Actor) {
  checkPlan(input);
  const [before] = await db.select().from(ratePlans).where(eq(ratePlans.id, id));
  if (!before) throw new BookingError(404, 'Rate not found');
  if (before.active) await checkOverlap(db, before.apartmentId, input, id);
  const [p] = await db.update(ratePlans).set(planValues(input)).where(eq(ratePlans.id, id)).returning();
  await audit(actor, 'rate_plan', id, 'update', { before: { baseRate: before.baseRate, weekendRate: before.weekendRate, validFrom: before.validFrom, validTo: before.validTo }, after: planValues(input) }, db);
  return p;
}

export async function setRatePlanActive(db: DB, id: number, active: boolean, actor: Actor) {
  const [p] = await db.select().from(ratePlans).where(eq(ratePlans.id, id));
  if (!p) throw new BookingError(404, 'Rate not found');
  if (active) await checkOverlap(db, p.apartmentId, p, id);
  if (!active && !p.validFrom) {
    const [apt] = await db.select({ active: apartments.active }).from(apartments).where(eq(apartments.id, p.apartmentId));
    if (apt?.active) throw new BookingError(400, 'An open apartment needs its standard rate — edit it instead, or hide the apartment first');
  }
  const [u] = await db.update(ratePlans).set({ active }).where(eq(ratePlans.id, id)).returning();
  await audit(actor, 'rate_plan', id, active ? 'activate' : 'deactivate', { apartmentId: p.apartmentId }, db);
  return u;
}

/* ── Policies ──────────────────────────────────────────────────────────── */

export type PolicyInput = Partial<Omit<typeof policies.$inferInsert, 'id'>>;

export async function getPolicies(db: DB) {
  const [p] = await db.select().from(policies).where(eq(policies.id, 1));
  return p;
}

export async function updatePolicies(db: DB, input: PolicyInput, actor: Actor) {
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (input.depositPct != null && (input.depositPct < 1 || input.depositPct > 100)) throw new BookingError(400, 'Deposit must be 1–100%');
  if (input.holdMinutes != null && (input.holdMinutes < 5 || input.holdMinutes > 120)) throw new BookingError(400, 'Payment hold must be 5–120 minutes');
  if (input.freeCancellationDays != null && (input.freeCancellationDays < 0 || input.freeCancellationDays > 365)) throw new BookingError(400, 'Check the free cancellation days');
  if (input.cancellationFeePct != null && (input.cancellationFeePct < 0 || input.cancellationFeePct > 100)) throw new BookingError(400, 'Cancellation fee must be 0–100%');
  if (input.checkInTime != null && !time.test(input.checkInTime)) throw new BookingError(400, 'Check-in time must be like 14:00');
  if (input.checkOutTime != null && !time.test(input.checkOutTime)) throw new BookingError(400, 'Check-out time must be like 11:00');
  const before = await getPolicies(db);
  const [p] = await db.insert(policies).values({ id: 1, ...input }).onConflictDoUpdate({ target: policies.id, set: input }).returning();
  const changed = Object.fromEntries(Object.entries(input).filter(([k, v]) => (before as Record<string, unknown> | undefined)?.[k] !== v));
  if (Object.keys(changed).length) await audit(actor, 'policies', 1, 'update', changed, db);
  return p;
}
