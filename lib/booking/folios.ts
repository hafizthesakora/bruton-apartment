/**
 * Folios & payments — plan §4: per-booking ledger (charges, payments, balance, refunds),
 * manual payment entry, printable invoice and receipt.
 *
 * The ledger is append-only. Mistakes are put right with an adjustment (a negative charge)
 * or a refund, never by editing an entry, so the audit trail and receipts stay true.
 */
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { apartments, bookings, folioEntries, guests, staffUsers } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { loadSite, queuePaymentReceipt } from '@/lib/notify';
import { BookingError } from './engine';
import { nightsBetween } from './pricing';

type Actor = { id: number; name: string };
type Method = (typeof folioEntries.$inferSelect)['method'] & string;
export type DeskMethod = 'cash' | 'momo' | 'transfer' | 'card';
export type PaymentInput = { amount: number; method: DeskMethod; reference?: string };

export const METHOD_LABEL: Record<Method, string> = {
  cash: 'Cash', momo: 'Mobile Money', transfer: 'Bank transfer', card: 'Card', paystack: 'Paystack', ota: 'Paid on channel',
};

const like = (q: string) => `%${q.replace(/[%_\\]/g, '')}%`;
const ghs = (p: number) => `GH₵ ${(p / 100).toFixed(2)}`;

const BALANCE_SQL = sql<number>`coalesce(sum(case when ${folioEntries.type} = 'payment' then -${folioEntries.amount} else ${folioEntries.amount} end), 0)::int`;

/** Balance owed on a booking (pesewas): charges − payments + refunds. */
export async function bookingBalance(db: DB | Tx, bookingId: number) {
  const [{ balance }] = await db.select({ balance: BALANCE_SQL }).from(folioEntries).where(eq(folioEntries.bookingId, bookingId));
  return Number(balance);
}

async function totals(db: DB | Tx, bookingId: number) {
  const [r] = await db.select({
    charges: sql<number>`coalesce(sum(${folioEntries.amount}) filter (where ${folioEntries.type} = 'charge'), 0)::int`,
    payments: sql<number>`coalesce(sum(${folioEntries.amount}) filter (where ${folioEntries.type} = 'payment'), 0)::int`,
    refunds: sql<number>`coalesce(sum(${folioEntries.amount}) filter (where ${folioEntries.type} = 'refund'), 0)::int`,
  }).from(folioEntries).where(eq(folioEntries.bookingId, bookingId));
  const t = { charges: Number(r.charges), payments: Number(r.payments), refunds: Number(r.refunds) };
  return { ...t, paid: t.payments - t.refunds, balance: t.charges - t.payments + t.refunds };
}

/** Post a desk payment, audit it and queue the guest's receipt. `context` ends up in the description. */
export async function recordPayment(tx: Tx, bookingId: number, pay: PaymentInput, actor: Actor, context: string) {
  if (pay.amount <= 0) return null;
  const reference = pay.reference?.trim() || null;
  const [entry] = await tx.insert(folioEntries).values({
    bookingId, type: 'payment', amount: pay.amount, method: pay.method, reference,
    description: `${METHOD_LABEL[pay.method]} payment ${context}`, createdBy: actor.id,
  }).returning();
  await audit(actor, 'booking', bookingId, 'payment', { amount: pay.amount, method: pay.method, entryId: entry.id }, tx);
  await queuePaymentReceipt(tx, bookingId, { amount: pay.amount, method: METHOD_LABEL[pay.method], reference: reference ?? `RCT-${entry.id}` });
  return entry;
}

/* ── Adding entries ────────────────────────────────────────────────────── */

export type FolioEntryInput =
  | { kind: 'charge'; description: string; amount: number }
  | { kind: 'payment'; amount: number; method: DeskMethod; reference?: string }
  | { kind: 'refund'; amount: number; method: DeskMethod | 'paystack'; reference?: string; reason: string }
  | { kind: 'adjustment'; amount: number; reason: string };

/** Kinds that need the `refunds` permission (owner / manager). */
export const MANAGER_ONLY: FolioEntryInput['kind'][] = ['refund', 'adjustment'];

export async function addFolioEntry(db: DB, bookingId: number, input: FolioEntryInput, actor: Actor) {
  if (!(input.amount > 0)) throw new BookingError(400, 'Enter an amount above zero');
  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!b) throw new BookingError(404, 'Booking not found');
    if (!['confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(b.status)) {
      throw new BookingError(400, `This booking is ${b.status.replace('_', ' ')} — there is no bill to post to yet`);
    }
    const t = await totals(tx, bookingId);

    switch (input.kind) {
      case 'charge': {
        if (!input.description.trim()) throw new BookingError(400, 'Say what the charge is for');
        if (b.status === 'cancelled') throw new BookingError(400, 'This booking is cancelled — no new charges');
        const [e] = await tx.insert(folioEntries).values({ bookingId, type: 'charge', amount: input.amount, description: input.description.trim(), createdBy: actor.id }).returning();
        await audit(actor, 'booking', bookingId, 'charge', { amount: input.amount, description: e.description, entryId: e.id }, tx);
        return e;
      }
      case 'payment': {
        if (input.amount > t.balance) {
          throw new BookingError(400, t.balance > 0 ? `That is more than the ${ghs(t.balance)} owing` : 'Nothing is owing on this bill');
        }
        return (await recordPayment(tx, bookingId, input, actor, 'at the desk'))!;
      }
      case 'refund': {
        if (!input.reason.trim()) throw new BookingError(400, 'Give a reason for the refund');
        if (input.amount > t.paid) throw new BookingError(400, `The guest has only paid ${ghs(t.paid)} on this bill`);
        const [e] = await tx.insert(folioEntries).values({
          bookingId, type: 'refund', amount: input.amount, method: input.method, reference: input.reference?.trim() || null,
          description: `Refund (${METHOD_LABEL[input.method]}): ${input.reason.trim()}`, createdBy: actor.id,
        }).returning();
        await audit(actor, 'booking', bookingId, 'refund', { amount: input.amount, method: input.method, reason: input.reason.trim(), entryId: e.id }, tx);
        return e;
      }
      case 'adjustment': {
        if (!input.reason.trim()) throw new BookingError(400, 'Give a reason for the adjustment');
        if (input.amount > t.charges) throw new BookingError(400, `The bill only comes to ${ghs(t.charges)}`);
        const [e] = await tx.insert(folioEntries).values({
          bookingId, type: 'charge', amount: -input.amount, description: `Adjustment: ${input.reason.trim()}`, createdBy: actor.id,
        }).returning();
        await audit(actor, 'booking', bookingId, 'adjustment', { amount: input.amount, reason: input.reason.trim(), entryId: e.id }, tx);
        return e;
      }
    }
  });
}

/* ── Reading ───────────────────────────────────────────────────────────── */

export async function folioList(db: DB, opts: { q?: string; owing?: boolean; limit?: number } = {}) {
  const q = opts.q?.trim();
  const sum = (type: 'charge' | 'payment' | 'refund') =>
    sql<number>`coalesce((select sum(${folioEntries.amount}) from ${folioEntries} where ${folioEntries.bookingId} = ${bookings.id} and ${folioEntries.type} = ${type}), 0)::int`;
  const balanceExpr = sql`(${sum('charge')} - ${sum('payment')} + ${sum('refund')})`;

  const rows = await db.select({
    id: bookings.id, reference: bookings.reference, status: bookings.status, source: bookings.source,
    checkIn: bookings.checkIn, checkOut: bookings.checkOut,
    guestName: guests.fullName, guestPhone: guests.phone, apartmentName: apartments.name,
    charges: sum('charge'), payments: sum('payment'), refunds: sum('refund'),
  }).from(bookings)
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .where(and(
      inArray(bookings.status, ['confirmed', 'checked_in', 'checked_out', 'cancelled']),
      q ? or(ilike(bookings.reference, like(q)), ilike(guests.fullName, like(q)), ilike(guests.phone, like(q))) : undefined,
      opts.owing ? sql`${balanceExpr} > 0` : undefined,
    ))
    .orderBy(desc(bookings.checkIn), desc(bookings.id))
    .limit(opts.limit ?? 100);

  return rows.map((r) => {
    const charges = Number(r.charges), payments = Number(r.payments), refunds = Number(r.refunds);
    return { ...r, charges, paid: payments - refunds, balance: charges - payments + refunds };
  });
}

export async function folioDetail(db: DB, bookingId: number) {
  const [row] = await db.select({ b: bookings, g: guests, apartmentName: apartments.name })
    .from(bookings)
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .where(eq(bookings.id, bookingId));
  if (!row) throw new BookingError(404, 'Booking not found');

  const [entries, t, { site }] = await Promise.all([
    db.select({
      id: folioEntries.id, type: folioEntries.type, description: folioEntries.description, amount: folioEntries.amount,
      method: folioEntries.method, reference: folioEntries.reference, createdAt: folioEntries.createdAt, staffName: staffUsers.name,
    }).from(folioEntries)
      .leftJoin(staffUsers, eq(staffUsers.id, folioEntries.createdBy))
      .where(eq(folioEntries.bookingId, bookingId))
      .orderBy(folioEntries.createdAt, folioEntries.id),
    totals(db, bookingId),
    loadSite(db),
  ]);

  const { b, g } = row;
  return {
    booking: {
      id: b.id, reference: b.reference, status: b.status, source: b.source, channelRef: b.channelRef,
      checkIn: b.checkIn, checkOut: b.checkOut, nights: nightsBetween(b.checkIn, b.checkOut),
      adults: b.adults, children: b.children, apartmentName: row.apartmentName, createdAt: b.createdAt,
    },
    guest: { id: g.id, fullName: g.fullName, phone: g.phone, email: g.email },
    entries,
    totals: t,
    site: { name: site.name, phone: site.phone, url: site.url },
  };
}
