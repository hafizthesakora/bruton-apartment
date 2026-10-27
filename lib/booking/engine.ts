/**
 * Booking engine — plan §3 lifecycle:
 *   held → pending_payment → confirmed → checked_in → checked_out   (side exits: expired, cancelled)
 *
 * Every function takes the db so tests can run against an in-memory PGlite.
 * The DB exclusion constraint (drizzle/0001) is the final double-booking guard; the
 * checks here exist to give guests a friendly answer before they hit it.
 */
import crypto from 'crypto';
import { and, asc, eq, gt, inArray, isNull, lt, ne } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import {
  alerts, apartmentPhotos, apartments, bookings, folioEntries, guests, housekeepingStatus,
  paymentIntents, policies, ratePlans,
} from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { queueBookingConfirmed, queuePaymentReceipt } from '@/lib/notify';
import { folioPaid } from './folio';
import {
  amountDueNow, isISODate, nightsBetween, paymentOptions, quoteStay, todayAtProperty,
  QuoteError, type PaymentModeOption, type Quote,
} from './pricing';

export const ACTIVE_STATUSES = ['held', 'pending_payment', 'confirmed', 'checked_in'] as const;
const HOLD_STATUSES = ['held', 'pending_payment'] as const;

const MAX_NIGHTS = 90;
const MAX_ADVANCE_DAYS = 540;

const WEBSITE = { id: null, name: 'Website' };

export class BookingError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newReference() {
  let s = 'BG';
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
  return s;
}

/** Postgres exclusion_violation — someone else holds overlapping dates. */
export function isOverlapError(err: unknown): boolean {
  for (let e = err as { code?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === '23P01') return true;
  }
  return false;
}

export async function getPolicy(db: DB | Tx) {
  const [p] = await db.select().from(policies).where(eq(policies.id, 1));
  if (!p) throw new Error('Policies row missing — run the seed');
  return p;
}

export function validateStay(checkIn: string, checkOut: string, now = new Date()) {
  if (!isISODate(checkIn) || !isISODate(checkOut)) throw new BookingError(400, 'Choose valid dates');
  const today = todayAtProperty(now);
  if (checkIn < today) throw new BookingError(400, 'Check-in can’t be in the past');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new BookingError(400, 'Check-out must be after check-in');
  if (nights > MAX_NIGHTS) throw new BookingError(400, `For stays over ${MAX_NIGHTS} nights, please contact us`);
  if (nightsBetween(today, checkIn) > MAX_ADVANCE_DAYS) throw new BookingError(400, 'Those dates are too far ahead to book online');
  return nights;
}

/** Holds past their expiry stop blocking the dates. Safe to call often. */
export async function expireHolds(db: DB | Tx, now = new Date()) {
  const expired = await db.update(bookings)
    .set({ status: 'expired', updatedAt: now })
    .where(and(inArray(bookings.status, [...HOLD_STATUSES]), lt(bookings.holdExpiresAt, now)))
    .returning({ id: bookings.id, reference: bookings.reference });
  return expired;
}

/* ── Availability search ───────────────────────────────────────────────── */

export type SearchResult = {
  id: number;
  slug: string;
  name: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  photos: { url: string; alt: string }[];
  available: boolean;
  reason?: string;
  quote?: Quote;
};

export async function searchAvailability(
  db: DB,
  q: { checkIn: string; checkOut: string; guests: number },
  now = new Date(),
): Promise<SearchResult[]> {
  validateStay(q.checkIn, q.checkOut, now);
  await expireHolds(db, now);

  const apts = await db.select().from(apartments).where(eq(apartments.active, true)).orderBy(asc(apartments.sortOrder));
  if (apts.length === 0) return [];
  const ids = apts.map((a) => a.id);

  const [photos, plans, hk, taken] = await Promise.all([
    db.select().from(apartmentPhotos).where(inArray(apartmentPhotos.apartmentId, ids)).orderBy(asc(apartmentPhotos.sortOrder)),
    db.select().from(ratePlans).where(and(inArray(ratePlans.apartmentId, ids), eq(ratePlans.active, true))),
    db.select().from(housekeepingStatus).where(inArray(housekeepingStatus.apartmentId, ids)),
    db.selectDistinct({ apartmentId: bookings.apartmentId }).from(bookings).where(and(
      inArray(bookings.status, [...ACTIVE_STATUSES]),
      lt(bookings.checkIn, q.checkOut),
      gt(bookings.checkOut, q.checkIn),
    )),
  ]);
  const takenIds = new Set(taken.map((t) => t.apartmentId));
  const outOfOrder = new Set(hk.filter((h) => h.status === 'out_of_order').map((h) => h.apartmentId));

  return apts.map((a) => {
    const base = {
      id: a.id, slug: a.slug, name: a.name, description: a.description, bedrooms: a.bedrooms,
      bathrooms: a.bathrooms, maxGuests: a.maxGuests, amenities: a.amenities,
      photos: photos.filter((p) => p.apartmentId === a.id).map((p) => ({ url: p.url, alt: p.alt })),
    };
    if (q.guests > a.maxGuests) return { ...base, available: false, reason: `Sleeps up to ${a.maxGuests}` };
    if (takenIds.has(a.id) || outOfOrder.has(a.id)) return { ...base, available: false, reason: 'Booked for these dates' };
    try {
      const quote = quoteStay(plans.filter((p) => p.apartmentId === a.id), q.checkIn, q.checkOut);
      return { ...base, available: true, quote };
    } catch (err) {
      if (err instanceof QuoteError) return { ...base, available: false, reason: err.message };
      throw err;
    }
  });
}

/* ── Holds ─────────────────────────────────────────────────────────────── */

export type HoldInput = {
  apartmentId: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  paymentMode: PaymentModeOption;
  guest: { fullName: string; email: string; phone: string };
  notes?: string;
};

async function findOrCreateGuest(tx: Tx, g: HoldInput['guest']) {
  const email = g.email.trim().toLowerCase();
  const [existing] = await tx.select().from(guests)
    .where(and(eq(guests.email, email), isNull(guests.mergedIntoId)))
    .orderBy(asc(guests.id)).limit(1);
  if (existing) {
    if (!existing.phone && g.phone) await tx.update(guests).set({ phone: g.phone }).where(eq(guests.id, existing.id));
    return existing.id;
  }
  const [created] = await tx.insert(guests).values({ fullName: g.fullName.trim(), email, phone: g.phone.trim() }).returning();
  return created.id;
}

/**
 * Hold an apartment for the guest while they pay. Pay-on-arrival bookings skip
 * the payment step and are confirmed straight away.
 */
export async function createHold(db: DB, input: HoldInput, opts: { paystackEnabled: boolean; now?: Date }) {
  const now = opts.now ?? new Date();
  validateStay(input.checkIn, input.checkOut, now);

  try {
    return await db.transaction(async (tx) => {
      await expireHolds(tx, now);
      const policy = await getPolicy(tx);

      if (!paymentOptions(policy, opts.paystackEnabled).includes(input.paymentMode)) {
        throw new BookingError(400, 'That payment option isn’t available');
      }

      const [apt] = await tx.select().from(apartments).where(and(eq(apartments.id, input.apartmentId), eq(apartments.active, true)));
      if (!apt) throw new BookingError(404, 'Apartment not found');
      if (input.adults + input.children > apt.maxGuests) throw new BookingError(400, `${apt.name} sleeps up to ${apt.maxGuests}`);

      const [hk] = await tx.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, apt.id));
      if (hk?.status === 'out_of_order') throw new BookingError(409, 'Sorry — that apartment is no longer available for these dates');

      const plans = await tx.select().from(ratePlans).where(and(eq(ratePlans.apartmentId, apt.id), eq(ratePlans.active, true)));
      let quote: Quote;
      try {
        quote = quoteStay(plans, input.checkIn, input.checkOut);
      } catch (err) {
        if (err instanceof QuoteError) throw new BookingError(400, err.message);
        throw err;
      }

      const guestId = await findOrCreateGuest(tx, input.guest);
      const [booking] = await tx.insert(bookings).values({
        reference: newReference(),
        apartmentId: apt.id,
        guestId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        adults: input.adults,
        children: input.children,
        status: 'held',
        source: 'direct',
        paymentMode: input.paymentMode,
        totalAmount: quote.total,
        amountDueNow: amountDueNow(quote.total, input.paymentMode, policy.depositPct),
        holdExpiresAt: new Date(now.getTime() + policy.holdMinutes * 60_000),
        notes: input.notes?.trim() ?? '',
      }).returning();

      await audit(WEBSITE, 'booking', booking.id, 'hold', { reference: booking.reference, quote: { total: quote.total, nights: quote.nights } }, tx);

      if (input.paymentMode === 'pay_on_arrival') {
        return { booking: await confirmBooking(tx, booking.id, WEBSITE, now), apartment: apt, quote };
      }
      return { booking, apartment: apt, quote };
    });
  } catch (err) {
    if (isOverlapError(err)) throw new BookingError(409, 'Sorry — someone has just booked those dates. Please pick another apartment or dates.');
    throw err;
  }
}

/** Record an online payment attempt and keep the hold alive while the guest is on the payment page. */
export async function startPayment(db: DB, bookingId: number, provider: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const policy = await getPolicy(tx);
    const [booking] = await tx.update(bookings)
      .set({ status: 'pending_payment', holdExpiresAt: new Date(now.getTime() + policy.holdMinutes * 60_000), updatedAt: now })
      .where(and(eq(bookings.id, bookingId), inArray(bookings.status, [...HOLD_STATUSES]), gt(bookings.holdExpiresAt, now)))
      .returning();
    if (!booking) throw new BookingError(409, 'This booking hold has expired — please start again');

    const reference = `${booking.reference}-${crypto.randomBytes(3).toString('hex')}`;
    const [intent] = await tx.insert(paymentIntents).values({
      bookingId: booking.id, provider, reference, amount: booking.amountDueNow,
    }).returning();
    return { booking, intent };
  });
}

/** Give the dates back if we couldn't send the guest to the payment page. */
export async function releaseHold(db: DB, bookingId: number, now = new Date()) {
  await db.update(bookings).set({ status: 'expired', updatedAt: now })
    .where(and(eq(bookings.id, bookingId), inArray(bookings.status, [...HOLD_STATUSES])));
}

/* ── Confirmation ──────────────────────────────────────────────────────── */

type Actor = { id: number | null; name: string };

/**
 * held / pending_payment (or a lapsed hold whose payment arrived late) → confirmed.
 * Posts the accommodation charge to the folio and queues the confirmation messages
 * exactly once, on the transition.
 * Throws an overlap error if a lapsed hold's dates have since been taken.
 */
export async function confirmBooking(tx: Tx, bookingId: number, actor: Actor, now = new Date()) {
  const [booking] = await tx.update(bookings)
    .set({ status: 'confirmed', holdExpiresAt: null, updatedAt: now })
    .where(and(eq(bookings.id, bookingId), inArray(bookings.status, ['held', 'pending_payment', 'expired'])))
    .returning();
  if (!booking) {
    const [current] = await tx.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!current) throw new BookingError(404, 'Booking not found');
    return current;
  }

  const [apt] = await tx.select({ name: apartments.name }).from(apartments).where(eq(apartments.id, booking.apartmentId));
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  await tx.insert(folioEntries).values({
    bookingId: booking.id,
    type: 'charge',
    description: `Accommodation — ${apt?.name ?? 'Apartment'}, ${nights} night${nights === 1 ? '' : 's'}`,
    amount: booking.totalAmount,
    createdBy: actor.id,
  });
  await audit(actor, 'booking', booking.id, 'confirm', { reference: booking.reference }, tx);
  await queueBookingConfirmed(tx, booking.id);
  return booking;
}

/* ── Paystack webhook ──────────────────────────────────────────────────── */

export type ChargeOutcome = 'confirmed' | 'duplicate' | 'unknown_reference' | 'amount_mismatch' | 'needs_refund' | 'recorded';

/**
 * Apply a verified charge.success. Idempotent on the payment reference, so Paystack's
 * retries (and our own reconciliation) can call it as often as they like.
 */
export async function applySuccessfulCharge(
  db: DB,
  charge: { reference: string; amount: number; currency: string; channel?: string; raw?: unknown },
  now = new Date(),
): Promise<ChargeOutcome> {
  return db.transaction(async (tx) => {
    const [intent] = await tx.update(paymentIntents)
      .set({ status: 'success', completedAt: now, raw: charge.raw ?? null })
      .where(and(eq(paymentIntents.reference, charge.reference), ne(paymentIntents.status, 'success')))
      .returning();
    if (!intent) {
      const [seen] = await tx.select({ id: paymentIntents.id }).from(paymentIntents).where(eq(paymentIntents.reference, charge.reference));
      return seen ? 'duplicate' : 'unknown_reference';
    }
    if (!intent.bookingId) return 'recorded';

    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, intent.bookingId));
    if (!booking) return 'recorded';

    if (charge.currency !== 'GHS' || charge.amount !== intent.amount) {
      await tx.update(paymentIntents).set({ status: 'mismatch' }).where(eq(paymentIntents.id, intent.id));
      await tx.insert(alerts).values({
        type: 'payment_mismatch',
        bookingId: booking.id,
        message: `Paystack payment ${charge.reference} for ${booking.reference} was ${charge.currency} ${charge.amount / 100}, expected GHS ${intent.amount / 100}. Check before confirming.`,
      });
      return 'amount_mismatch';
    }

    await tx.insert(folioEntries).values({
      bookingId: booking.id,
      type: 'payment',
      description: `Online payment (Paystack${charge.channel ? ` · ${charge.channel.replace('_', ' ')}` : ''})`,
      amount: charge.amount,
      method: 'paystack',
      reference: charge.reference,
    });

    // Already-confirmed booking (e.g. a balance payment): just send a receipt.
    if (booking.status === 'confirmed' || booking.status === 'checked_in' || booking.status === 'checked_out') {
      await queuePaymentReceipt(tx, booking.id, { amount: charge.amount, method: 'Paystack', reference: charge.reference });
      return 'recorded';
    }

    if (booking.status === 'cancelled') {
      await tx.insert(alerts).values({
        type: 'payment_on_cancelled',
        bookingId: booking.id,
        message: `Payment received for cancelled booking ${booking.reference} — refund or rebook the guest.`,
      });
      return 'needs_refund';
    }

    // A lapsed hold can still be confirmed if nobody has taken the dates in the meantime.
    try {
      await tx.transaction((sp) => confirmBooking(sp, booking.id, WEBSITE, now));
    } catch (err) {
      if (!isOverlapError(err)) throw err;
      await tx.insert(alerts).values({
        type: 'payment_after_hold_expired',
        bookingId: booking.id,
        message: `Payment for ${booking.reference} arrived after the hold expired and the dates were re-booked. Contact the guest to move or refund.`,
      });
      return 'needs_refund';
    }
    return 'confirmed';
  });
}

/* ── Guest-facing view ─────────────────────────────────────────────────── */

export async function getBookingForGuest(db: DB, reference: string) {
  await expireHolds(db);
  const [row] = await db.select({
    reference: bookings.reference,
    status: bookings.status,
    checkIn: bookings.checkIn,
    checkOut: bookings.checkOut,
    adults: bookings.adults,
    children: bookings.children,
    paymentMode: bookings.paymentMode,
    totalAmount: bookings.totalAmount,
    amountDueNow: bookings.amountDueNow,
    holdExpiresAt: bookings.holdExpiresAt,
    apartmentName: apartments.name,
    guestName: guests.fullName,
    bookingId: bookings.id,
  }).from(bookings)
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .where(eq(bookings.reference, reference.toUpperCase()));
  if (!row) return null;

  const [paid, policy] = await Promise.all([folioPaid(db, row.bookingId), getPolicy(db)]);

  const { bookingId: _id, guestName, ...rest } = row;
  return {
    ...rest,
    guestFirstName: guestName.split(' ')[0],
    nights: nightsBetween(row.checkIn, row.checkOut),
    paid,
    checkInTime: policy.checkInTime,
    checkOutTime: policy.checkOutTime,
  };
}
