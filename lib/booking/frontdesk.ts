/**
 * Front desk — plan §4: today's arrivals / departures, ID capture, key and deposit status,
 * check-in / check-out. Checking out sets the apartment to dirty and queues its clean
 * (plan: "set to dirty on checkout").
 */
import { and, asc, eq, inArray, lt, sql } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { alerts, apartments, bookings, folioEntries, guests, housekeepingStatus, housekeepingTasks } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { queuePaymentReceipt } from '@/lib/notify';
import { BookingError } from './engine';
import { addDays, isISODate, todayAtProperty } from './pricing';

type Actor = { id: number; name: string };
export type PaymentInput = { amount: number; method: 'cash' | 'momo' | 'transfer' | 'card'; reference?: string };

const METHOD_LABEL: Record<PaymentInput['method'], string> = { cash: 'Cash', momo: 'Mobile Money', transfer: 'Bank transfer', card: 'Card' };

/** Balance owed on a booking (pesewas): charges − payments + refunds. */
export async function bookingBalance(db: DB | Tx, bookingId: number) {
  const [{ balance }] = await db.select({
    balance: sql<number>`coalesce(sum(case when ${folioEntries.type} = 'payment' then -${folioEntries.amount} else ${folioEntries.amount} end), 0)::int`,
  }).from(folioEntries).where(eq(folioEntries.bookingId, bookingId));
  return Number(balance);
}

async function takePayment(tx: Tx, booking: { id: number; source: string }, pay: PaymentInput, actor: Actor, when: string) {
  if (pay.amount <= 0) return;
  await tx.insert(folioEntries).values({
    bookingId: booking.id, type: 'payment', amount: pay.amount, method: pay.method,
    reference: pay.reference?.trim() || null, description: `${METHOD_LABEL[pay.method]} payment at ${when}`, createdBy: actor.id,
  });
  await audit(actor, 'booking', booking.id, 'payment', { amount: pay.amount, method: pay.method, at: when }, tx);
  await queuePaymentReceipt(tx, booking.id, { amount: pay.amount, method: METHOD_LABEL[pay.method], reference: pay.reference?.trim() || `${when} desk` });
}

/* ── Check-in ──────────────────────────────────────────────────────────── */

export type CheckInInput = {
  idType: string;
  idNumber: string;
  nationality?: string;
  keyIssued: boolean;
  securityDeposit?: number;
  payment?: PaymentInput;
};

export async function checkIn(db: DB, id: number, input: CheckInInput, actor: Actor, now = new Date()) {
  if (!input.idType.trim() || !input.idNumber.trim()) throw new BookingError(400, 'Record the guest’s ID before checking in');
  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.id, id));
    if (!b) throw new BookingError(404, 'Booking not found');
    if (b.status !== 'confirmed') throw new BookingError(400, `Only confirmed bookings can be checked in (this one is ${b.status.replace('_', ' ')})`);
    const today = todayAtProperty(now);
    if (b.checkIn > today) throw new BookingError(400, `This booking starts on ${b.checkIn} — move it on the calendar to check in early`);
    if (b.checkOut <= today) throw new BookingError(400, 'This stay has already ended');

    const [hk] = await tx.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, b.apartmentId));
    if (hk?.status === 'out_of_order') throw new BookingError(409, 'This apartment is out of order — move the guest to another apartment first');

    await tx.update(guests).set({
      idType: input.idType.trim(), idNumber: input.idNumber.trim(),
      ...(input.nationality?.trim() ? { nationality: input.nationality.trim() } : {}),
    }).where(eq(guests.id, b.guestId));

    const [updated] = await tx.update(bookings).set({
      status: 'checked_in', checkedInAt: now, idCaptured: true, keyIssued: input.keyIssued,
      securityDeposit: input.securityDeposit ?? 0, updatedAt: now,
    }).where(eq(bookings.id, id)).returning();

    if (input.payment) await takePayment(tx, b, input.payment, actor, 'check-in');
    // ID number deliberately left out of the audit trail (Data Protection Act: keep personal data minimal).
    await audit(actor, 'booking', id, 'check_in', { keyIssued: input.keyIssued, securityDeposit: input.securityDeposit ?? 0, idType: input.idType }, tx);
    return { booking: updated, warning: hk && hk.status !== 'clean' ? `Housekeeping shows this apartment as ${hk.status.replace('_', ' ')}` : null };
  });
}

/* ── Check-out ─────────────────────────────────────────────────────────── */

export type CheckOutInput = {
  keyReturned: boolean;
  securityDepositReturned?: number;
  depositNote?: string;
  payment?: PaymentInput;
  /** Let the guest leave with money still owing (recorded in the audit log). */
  allowBalance?: boolean;
};

export async function checkOut(db: DB, id: number, input: CheckOutInput, actor: Actor, now = new Date()) {
  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.id, id));
    if (!b) throw new BookingError(404, 'Booking not found');
    if (b.status !== 'checked_in') throw new BookingError(400, 'Only checked-in guests can be checked out');

    if (input.payment) await takePayment(tx, b, input.payment, actor, 'check-out');
    const balance = await bookingBalance(tx, id);
    if (balance > 0 && !input.allowBalance) {
      throw new BookingError(409, `The guest still owes GH₵ ${(balance / 100).toFixed(2)}. Take payment, or tick “check out with balance owing”.`);
    }

    const returned = Math.max(0, Math.min(input.securityDepositReturned ?? b.securityDeposit, b.securityDeposit));
    const kept = b.securityDeposit - returned;
    if (kept > 0 && !input.depositNote?.trim()) throw new BookingError(400, 'Say why part of the security deposit is being kept');

    const today = todayAtProperty(now);
    const [updated] = await tx.update(bookings).set({
      status: 'checked_out', checkedOutAt: now, keyReturned: input.keyReturned, securityDepositReturned: returned,
      // An early departure frees the remaining nights (a stay keeps at least its first night).
      ...(b.checkOut > today ? { checkOut: today > b.checkIn ? today : addDays(b.checkIn, 1) } : {}),
      notes: kept > 0 ? [b.notes, `Security deposit: GH₵ ${(kept / 100).toFixed(2)} kept — ${input.depositNote!.trim()}`].filter(Boolean).join('\n') : b.notes,
      updatedAt: now,
    }).where(eq(bookings.id, id)).returning();

    await tx.insert(housekeepingStatus).values({ apartmentId: b.apartmentId, status: 'dirty', note: `Guest checked out (${b.reference})`, updatedBy: actor.id, updatedAt: now })
      .onConflictDoUpdate({ target: housekeepingStatus.apartmentId, set: { status: 'dirty', note: `Guest checked out (${b.reference})`, updatedBy: actor.id, updatedAt: now } });
    await tx.insert(housekeepingTasks).values({ apartmentId: b.apartmentId, date: today, task: `Checkout clean after ${b.reference}` });

    await audit(actor, 'booking', id, 'check_out', {
      keyReturned: input.keyReturned, securityDepositReturned: returned, kept, balanceOwing: balance > 0 ? balance : 0,
      ...(updated.checkOut !== b.checkOut ? { earlyDeparture: [b.checkOut, updated.checkOut] } : {}),
    }, tx);
    if (balance > 0) {
      await tx.insert(alerts).values({ type: 'balance_owing', bookingId: id, message: `${b.reference} checked out owing GH₵ ${(balance / 100).toFixed(2)} (allowed by ${actor.name}).` });
    }
    return updated;
  });
}

/* ── Day view ──────────────────────────────────────────────────────────── */

export async function frontDeskDay(db: DB, date: string) {
  if (!isISODate(date)) throw new BookingError(400, 'Choose a valid date');
  const rows = await db.select({
    id: bookings.id, reference: bookings.reference, status: bookings.status, source: bookings.source,
    checkIn: bookings.checkIn, checkOut: bookings.checkOut, adults: bookings.adults, children: bookings.children,
    notes: bookings.notes, idCaptured: bookings.idCaptured, keyIssued: bookings.keyIssued, keyReturned: bookings.keyReturned,
    securityDeposit: bookings.securityDeposit, securityDepositReturned: bookings.securityDepositReturned,
    checkedInAt: bookings.checkedInAt, checkedOutAt: bookings.checkedOutAt,
    apartmentId: apartments.id, apartmentName: apartments.name, hkStatus: housekeepingStatus.status,
    guestName: guests.fullName, guestPhone: guests.phone, guestEmail: guests.email,
    idType: guests.idType, nationality: guests.nationality,
    balance: sql<number>`coalesce((select sum(case when ${folioEntries.type} = 'payment' then -${folioEntries.amount} else ${folioEntries.amount} end) from ${folioEntries} where ${folioEntries.bookingId} = ${bookings.id}), 0)::int`,
  }).from(bookings)
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .leftJoin(housekeepingStatus, eq(housekeepingStatus.apartmentId, bookings.apartmentId))
    .where(and(
      inArray(bookings.status, ['confirmed', 'checked_in', 'checked_out']),
      sql`((${bookings.checkIn} <= ${date} and ${bookings.checkOut} >= ${date})
          or (${bookings.status} = 'checked_in' and ${bookings.checkOut} < ${date}))`,
    ))
    .orderBy(asc(apartments.sortOrder), asc(bookings.checkIn));

  const list = rows.map((r) => ({ ...r, balance: Number(r.balance) }));
  return {
    date,
    arrivals: list.filter((r) => r.checkIn === date),
    departures: list.filter((r) => r.checkOut === date && (r.status === 'checked_in' || r.status === 'checked_out')),
    inHouse: list.filter((r) => r.status === 'checked_in' && r.checkIn < date && r.checkOut > date),
    overdue: list.filter((r) => r.status === 'checked_in' && r.checkOut < date),
    noShows: list.filter((r) => r.status === 'confirmed' && r.checkIn < date),
  };
}

/** Counts for the dashboard / sidebar badge. */
export async function frontDeskCounts(db: DB, date = todayAtProperty()) {
  const [r] = await db.select({
    arrivals: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed' and ${bookings.checkIn} = ${date})::int`,
    departures: sql<number>`count(*) filter (where ${bookings.status} = 'checked_in' and ${bookings.checkOut} <= ${date})::int`,
  }).from(bookings).where(lt(bookings.checkIn, sql`${date}::date + 1`));
  return r;
}
