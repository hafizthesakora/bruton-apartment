/**
 * Staff-side booking operations for the booking calendar — plan §4 "Booking calendar":
 * create (walk-in / phone / channel), move, extend, cancel.
 *
 * Folio stays append-only: a price change posts a "Stay changed" adjustment for the
 * difference (negative when the stay gets cheaper) instead of editing the original charge.
 */
import { and, asc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { apartments, bookings, folioEntries, guests, housekeepingStatus, ratePlans } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { queueBookingChanged } from '@/lib/notify';
import { BookingError, confirmBooking, isOverlapError, newReference } from './engine';
import { isISODate, nightsBetween, quoteStay, QuoteError } from './pricing';

type Actor = { id: number; name: string };
export type Source = typeof bookings.$inferSelect['source'];

export const OTA_SOURCES: Source[] = ['airbnb', 'booking_com', 'vrbo', 'expedia'];
/** Guests we talk to directly — the ones who get our emails/SMS. OTA guests hear from the channel. */
export const isDirectSource = (s: Source) => !OTA_SOURCES.includes(s);

const MAX_NIGHTS = 365;

function validateDates(checkIn: string, checkOut: string) {
  if (!isISODate(checkIn) || !isISODate(checkOut)) throw new BookingError(400, 'Choose valid dates');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new BookingError(400, 'Check-out must be after check-in');
  if (nights > MAX_NIGHTS) throw new BookingError(400, `Stays are limited to ${MAX_NIGHTS} nights`);
  return nights;
}

async function priceFor(tx: DB | Tx, apartmentId: number, checkIn: string, checkOut: string) {
  const plans = await tx.select().from(ratePlans).where(and(eq(ratePlans.apartmentId, apartmentId), eq(ratePlans.active, true)));
  try {
    // Staff can book below the online minimum stay (e.g. a one-night walk-in).
    return quoteStay(plans.map((p) => ({ ...p, minNights: 1 })), checkIn, checkOut).total;
  } catch (err) {
    if (err instanceof QuoteError) throw new BookingError(400, `${err.message} — enter a price manually`);
    throw err;
  }
}

async function apartmentName(tx: Tx, id: number) {
  const [apt] = await tx.select({ name: apartments.name, active: apartments.active }).from(apartments).where(eq(apartments.id, id));
  if (!apt) throw new BookingError(404, 'Apartment not found');
  return apt.name;
}

function overlapMessage(err: unknown): never {
  if (isOverlapError(err)) throw new BookingError(409, 'Those dates overlap another booking for that apartment');
  throw err;
}

/** Rate-plan price for the booking form preview (pesewas). */
export async function staffQuote(db: DB, apartmentId: number, checkIn: string, checkOut: string) {
  validateDates(checkIn, checkOut);
  return priceFor(db, apartmentId, checkIn, checkOut);
}

/* ── Create ────────────────────────────────────────────────────────────── */

export type StaffBookingInput = {
  apartmentId: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  source: Source;
  channelRef?: string;
  guest: { id?: number; fullName: string; phone?: string; email?: string };
  /** Pesewas. Omit to use the rate plan. */
  totalAmount?: number;
  notes?: string;
  notify?: boolean;
};

export async function createStaffBooking(db: DB, input: StaffBookingInput, actor: Actor, now = new Date()) {
  validateDates(input.checkIn, input.checkOut);
  const ota = !isDirectSource(input.source);
  try {
    return await db.transaction(async (tx) => {
      await apartmentName(tx, input.apartmentId);
      const total = input.totalAmount ?? await priceFor(tx, input.apartmentId, input.checkIn, input.checkOut);

      let guestId = input.guest.id;
      if (!guestId) {
        const email = input.guest.email?.trim().toLowerCase() || null;
        const [existing] = email
          ? await tx.select({ id: guests.id }).from(guests).where(and(eq(guests.email, email), sql`${guests.mergedIntoId} is null`)).limit(1)
          : [];
        guestId = existing?.id ?? (await tx.insert(guests).values({
          fullName: input.guest.fullName.trim(), email, phone: input.guest.phone?.trim() || null,
        }).returning())[0].id;
      }

      const [held] = await tx.insert(bookings).values({
        reference: newReference(),
        apartmentId: input.apartmentId,
        guestId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        adults: input.adults,
        children: input.children,
        status: 'held',
        source: input.source,
        channelRef: input.channelRef?.trim() || null,
        paymentMode: 'pay_on_arrival',
        totalAmount: total,
        amountDueNow: 0,
        notes: input.notes?.trim() ?? '',
        createdBy: actor.id,
      }).returning();
      await audit(actor, 'booking', held.id, 'create', { source: input.source, total, priced: input.totalAmount == null ? 'rate plan' : 'manual' }, tx);

      const booking = await confirmBooking(tx, held.id, actor, now, { notify: input.notify ?? !ota });

      // OTA guests pay the channel; record it so the folio balances and revenue reports are complete.
      if (ota) {
        await tx.insert(folioEntries).values({
          bookingId: booking.id, type: 'payment', amount: total, method: 'ota',
          description: `Paid via ${input.source.replace('_', '.')}`, reference: input.channelRef?.trim() || null, createdBy: actor.id,
        });
      }
      return booking;
    });
  } catch (err) {
    overlapMessage(err);
  }
}

/* ── Move / extend ─────────────────────────────────────────────────────── */

export type ChangeInput = {
  apartmentId?: number;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  notes?: string;
  /** 'rates' re-prices from the rate plan, 'keep' keeps the current total, or a manual total in pesewas. */
  price?: 'rates' | 'keep' | number;
  notify?: boolean;
};

export async function changeBooking(db: DB, id: number, input: ChangeInput, actor: Actor, now = new Date()) {
  try {
    return await db.transaction(async (tx) => {
      const [b] = await tx.select().from(bookings).where(eq(bookings.id, id));
      if (!b) throw new BookingError(404, 'Booking not found');
      if (!['confirmed', 'checked_in'].includes(b.status)) throw new BookingError(400, `A ${b.status.replace('_', ' ')} booking can’t be changed`);

      const checkIn = input.checkIn ?? b.checkIn;
      const checkOut = input.checkOut ?? b.checkOut;
      const apartmentId = input.apartmentId ?? b.apartmentId;
      if (b.status === 'checked_in' && checkIn !== b.checkIn) throw new BookingError(400, 'The guest has checked in — only the check-out date can change');
      const nights = validateDates(checkIn, checkOut);
      const stayChanged = checkIn !== b.checkIn || checkOut !== b.checkOut || apartmentId !== b.apartmentId;

      const price = input.price ?? (stayChanged ? 'rates' : 'keep');
      const total = price === 'keep' ? b.totalAmount : price === 'rates' ? await priceFor(tx, apartmentId, checkIn, checkOut) : price;

      const [updated] = await tx.update(bookings).set({
        apartmentId, checkIn, checkOut, totalAmount: total,
        adults: input.adults ?? b.adults, children: input.children ?? b.children,
        notes: input.notes ?? b.notes, updatedAt: now,
      }).where(eq(bookings.id, id)).returning();

      const delta = total - b.totalAmount;
      if (delta !== 0) {
        const name = await apartmentName(tx, apartmentId);
        await tx.insert(folioEntries).values({
          bookingId: id, type: 'charge', amount: delta, createdBy: actor.id,
          description: `Stay changed — ${name}, ${nights} night${nights === 1 ? '' : 's'} (${delta > 0 ? '+' : '−'}${Math.abs(delta) / 100} GHS)`,
        });
      }

      const diff: Record<string, [unknown, unknown]> = {};
      for (const k of ['apartmentId', 'checkIn', 'checkOut', 'totalAmount', 'adults', 'children'] as const) {
        if (b[k] !== updated[k]) diff[k] = [b[k], updated[k]];
      }
      await audit(actor, 'booking', id, stayChanged ? 'move' : 'update', diff, tx);

      const notify = input.notify ?? isDirectSource(b.source);
      if (notify && (stayChanged || delta !== 0)) await queueBookingChanged(tx, id, 'changed');
      return updated;
    });
  } catch (err) {
    overlapMessage(err);
  }
}

/* ── Cancel ────────────────────────────────────────────────────────────── */

/**
 * Cancels and reverses the accommodation charges, keeping an optional cancellation fee.
 * Refunds of money already paid are a separate folio step (front desk / folios screen).
 */
export async function cancelBooking(db: DB, id: number, opts: { fee?: number; reason?: string; notify?: boolean }, actor: Actor, now = new Date()) {
  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.id, id));
    if (!b) throw new BookingError(404, 'Booking not found');
    if (!['held', 'pending_payment', 'confirmed'].includes(b.status)) throw new BookingError(400, `A ${b.status.replace('_', ' ')} booking can’t be cancelled`);

    const fee = Math.max(0, Math.min(opts.fee ?? 0, b.totalAmount));
    const [{ charged }] = await tx.select({ charged: sql<number>`coalesce(sum(${folioEntries.amount}), 0)::int` })
      .from(folioEntries).where(and(eq(folioEntries.bookingId, id), eq(folioEntries.type, 'charge'), sql`${folioEntries.orderId} is null`));
    if (Number(charged) !== 0) {
      await tx.insert(folioEntries).values({ bookingId: id, type: 'charge', amount: -Number(charged), description: 'Booking cancelled — accommodation reversed', createdBy: actor.id });
    }
    if (fee > 0) {
      await tx.insert(folioEntries).values({ bookingId: id, type: 'charge', amount: fee, description: 'Cancellation fee', createdBy: actor.id });
    }

    const [updated] = await tx.update(bookings).set({
      status: 'cancelled', cancelledAt: now, holdExpiresAt: null, updatedAt: now,
      notes: opts.reason ? [b.notes, `Cancelled: ${opts.reason.trim()}`].filter(Boolean).join('\n') : b.notes,
    }).where(eq(bookings.id, id)).returning();
    await audit(actor, 'booking', id, 'cancel', { fee, reason: opts.reason ?? '', from: b.status }, tx);

    if (b.status === 'confirmed' && (opts.notify ?? isDirectSource(b.source))) await queueBookingChanged(tx, id, 'cancelled');
    return updated;
  });
}

/* ── Calendar data ─────────────────────────────────────────────────────── */

export async function calendarData(db: DB, from: string, to: string) {
  if (!isISODate(from) || !isISODate(to) || nightsBetween(from, to) < 1 || nightsBetween(from, to) > 120) {
    throw new BookingError(400, 'Choose a date range of up to 120 days');
  }
  const [apts, hk, rows] = await Promise.all([
    db.select({ id: apartments.id, name: apartments.name, maxGuests: apartments.maxGuests, active: apartments.active })
      .from(apartments).orderBy(asc(apartments.sortOrder), asc(apartments.id)),
    db.select().from(housekeepingStatus),
    db.select({
      id: bookings.id, reference: bookings.reference, apartmentId: bookings.apartmentId,
      checkIn: bookings.checkIn, checkOut: bookings.checkOut, status: bookings.status, source: bookings.source,
      channelRef: bookings.channelRef, adults: bookings.adults, children: bookings.children,
      totalAmount: bookings.totalAmount, paymentMode: bookings.paymentMode, notes: bookings.notes,
      holdExpiresAt: bookings.holdExpiresAt,
      guestId: guests.id, guestName: guests.fullName, guestPhone: guests.phone, guestEmail: guests.email,
      paid: sql<number>`coalesce((select sum(case when ${folioEntries.type} = 'payment' then ${folioEntries.amount} when ${folioEntries.type} = 'refund' then -${folioEntries.amount} else 0 end) from ${folioEntries} where ${folioEntries.bookingId} = ${bookings.id}), 0)::int`,
      charged: sql<number>`coalesce((select sum(${folioEntries.amount}) from ${folioEntries} where ${folioEntries.bookingId} = ${bookings.id} and ${folioEntries.type} = 'charge'), 0)::int`,
    }).from(bookings)
      .innerJoin(guests, eq(guests.id, bookings.guestId))
      .where(and(
        inArray(bookings.status, ['held', 'pending_payment', 'confirmed', 'checked_in', 'checked_out']),
        lt(bookings.checkIn, to),
        gt(bookings.checkOut, from),
      ))
      .orderBy(asc(bookings.checkIn)),
  ]);
  const hkBy = new Map(hk.map((h) => [h.apartmentId, h.status]));
  return {
    from, to,
    apartments: apts.filter((a) => a.active || rows.some((r) => r.apartmentId === a.id))
      .map((a) => ({ ...a, hkStatus: hkBy.get(a.id) ?? 'clean' })),
    bookings: rows.map((r) => ({ ...r, paid: Number(r.paid), balance: Number(r.charged) - Number(r.paid) })),
  };
}
