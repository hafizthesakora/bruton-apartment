/**
 * Guest account — plan §4: login; booking list, receipts, change requests routed to front desk.
 *
 * Passwordless: the guest enters the phone or email they booked with and gets a 6-digit code.
 * An account is a contact, not a guest row — it shows every booking made with that phone or
 * email, so duplicates the front desk hasn't merged yet still appear together.
 */
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { and, asc, desc, eq, gt, gte, inArray, isNull, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { apartments, bookings, changeRequests, folioEntries, guestLoginCodes, guests } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from '@/lib/booking/engine';
import { nightsBetween } from '@/lib/booking/pricing';
import { loadSite, queueChangeRequest, queueChangeRequestReply } from '@/lib/notify';

type Actor = { id: number; name: string };

const CODE_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_WINDOW = 3;
const WINDOW_MS = 15 * 60_000;

/** 'e:<email>' or 'p:<last 9 phone digits>' — null if it's neither. */
export function contactKey(contact: string): string | null {
  const c = contact.trim().toLowerCase();
  if (c.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && c.length <= 150 ? `e:${c}` : null;
  const d = c.replace(/\D/g, '');
  return d.length >= 9 && d.length <= 15 ? `p:${d.slice(-9)}` : null;
}

const pepper = () => process.env.ADMIN_JWT_SECRET || 'bruton-dev-pepper';
const hashCode = (key: string, code: string) => createHash('sha256').update(`${key}:${code}:${pepper()}`).digest('hex');

function guestMatch(key: string) {
  const v = key.slice(2);
  return key.startsWith('e:')
    ? sql`lower(trim(${guests.email})) = ${v}`
    : sql`right(regexp_replace(coalesce(${guests.phone}, ''), '[^0-9]', '', 'g'), 9) = ${v}`;
}

async function guestIdsFor(db: DB, key: string) {
  const rows = await db.select({ id: guests.id }).from(guests).where(and(isNull(guests.mergedIntoId), guestMatch(key)));
  return rows.map((r) => r.id);
}

/* ── Sign-in codes ─────────────────────────────────────────────────────── */

/**
 * Make a code for this contact if any guest booked with it. Returns null (and makes nothing)
 * when there's no match — the caller shows the same message either way.
 */
export async function requestCode(db: DB, contact: string, now = new Date()) {
  const key = contactKey(contact);
  if (!key) throw new BookingError(400, 'Enter the email or phone number you booked with');
  if ((await guestIdsFor(db, key)).length === 0) return null;

  const [{ recent }] = await db.select({ recent: sql<number>`count(*)::int` }).from(guestLoginCodes)
    .where(and(eq(guestLoginCodes.contactKey, key), gte(guestLoginCodes.createdAt, new Date(now.getTime() - WINDOW_MS))));
  if (Number(recent) >= MAX_CODES_PER_WINDOW) throw new BookingError(429, 'Too many codes asked for — please wait a few minutes and try again');

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db.insert(guestLoginCodes).values({ contactKey: key, codeHash: hashCode(key, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS), createdAt: now });
  return { key, code, channel: key.startsWith('e:') ? 'email' as const : 'sms' as const };
}

/** Check a code; returns the contact key to put in the session. */
export async function verifyCode(db: DB, contact: string, code: string, now = new Date()) {
  const key = contactKey(contact);
  if (!key || !/^\d{6}$/.test(code.trim())) throw new BookingError(400, 'Enter the 6-digit code we sent you');
  const [row] = await db.select().from(guestLoginCodes)
    .where(and(eq(guestLoginCodes.contactKey, key), isNull(guestLoginCodes.usedAt), gt(guestLoginCodes.expiresAt, now)))
    .orderBy(desc(guestLoginCodes.createdAt)).limit(1);
  if (!row || row.attempts >= MAX_ATTEMPTS) throw new BookingError(400, 'That code has expired — ask for a new one');

  const ok = timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(hashCode(key, code.trim())));
  if (!ok) {
    await db.update(guestLoginCodes).set({ attempts: row.attempts + 1 }).where(eq(guestLoginCodes.id, row.id));
    throw new BookingError(400, row.attempts + 1 >= MAX_ATTEMPTS ? 'Too many wrong tries — ask for a new code' : 'That code isn’t right');
  }
  await db.update(guestLoginCodes).set({ usedAt: now }).where(eq(guestLoginCodes.id, row.id));
  return key;
}

/* ── Account view ──────────────────────────────────────────────────────── */

const SHOWN = ['pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] as const;

export async function accountView(db: DB, key: string) {
  const ids = await guestIdsFor(db, key);
  if (ids.length === 0) return { name: null, bookings: [] };
  const [first] = await db.select({ fullName: guests.fullName }).from(guests).where(inArray(guests.id, ids)).orderBy(desc(guests.id)).limit(1);

  const list = await db.select({
    id: bookings.id, reference: bookings.reference, status: bookings.status, checkIn: bookings.checkIn, checkOut: bookings.checkOut,
    adults: bookings.adults, children: bookings.children, totalAmount: bookings.totalAmount, apartmentName: apartments.name,
  }).from(bookings)
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .where(and(inArray(bookings.guestId, ids), inArray(bookings.status, [...SHOWN])))
    .orderBy(desc(bookings.checkIn));
  if (list.length === 0) return { name: first?.fullName ?? null, bookings: [] };

  const bIds = list.map((b) => b.id);
  const [entries, requests] = await Promise.all([
    db.select({ id: folioEntries.id, bookingId: folioEntries.bookingId, type: folioEntries.type, description: folioEntries.description, amount: folioEntries.amount, method: folioEntries.method, createdAt: folioEntries.createdAt })
      .from(folioEntries).where(inArray(folioEntries.bookingId, bIds)).orderBy(asc(folioEntries.createdAt), asc(folioEntries.id)),
    db.select({ id: changeRequests.id, bookingId: changeRequests.bookingId, message: changeRequests.message, status: changeRequests.status, response: changeRequests.response, createdAt: changeRequests.createdAt, resolvedAt: changeRequests.resolvedAt })
      .from(changeRequests).where(inArray(changeRequests.bookingId, bIds)).orderBy(desc(changeRequests.createdAt)),
  ]);

  return {
    name: first?.fullName ?? null,
    bookings: list.map((b) => {
      const mine = entries.filter((e) => e.bookingId === b.id);
      const charges = mine.filter((e) => e.type === 'charge').reduce((n, e) => n + e.amount, 0);
      const paid = mine.reduce((n, e) => n + (e.type === 'payment' ? e.amount : e.type === 'refund' ? -e.amount : 0), 0);
      return {
        ...b,
        nights: nightsBetween(b.checkIn, b.checkOut),
        charges, paid, balance: charges - paid,
        // Guests see the bill lines (not who posted them).
        lines: mine.map(({ id, type, description, amount, createdAt }) => ({ id, type, description, amount, createdAt })),
        receipts: mine.filter((e) => e.type === 'payment' && e.method !== 'ota').map(({ id, amount, method, createdAt }) => ({ id, amount, method, createdAt })),
        requests: requests.filter((r) => r.bookingId === b.id),
        canRequest: b.status === 'confirmed' || b.status === 'checked_in',
      };
    }),
  };
}

export async function guestReceipt(db: DB, key: string, entryId: number) {
  const ids = await guestIdsFor(db, key);
  const [row] = ids.length ? await db.select({
    id: folioEntries.id, type: folioEntries.type, amount: folioEntries.amount, method: folioEntries.method, reference: folioEntries.reference,
    createdAt: folioEntries.createdAt, bookingId: bookings.id, bookingRef: bookings.reference, checkIn: bookings.checkIn, checkOut: bookings.checkOut,
    apartmentName: apartments.name, guestName: guests.fullName,
  }).from(folioEntries)
    .innerJoin(bookings, eq(bookings.id, folioEntries.bookingId))
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .where(and(eq(folioEntries.id, entryId), eq(folioEntries.type, 'payment'), inArray(bookings.guestId, ids))) : [];
  if (!row) throw new BookingError(404, 'Receipt not found');
  const { site } = await loadSite(db);
  return { ...row, site: { name: site.name, phone: site.phone, url: site.url } };
}

/* ── Change requests ───────────────────────────────────────────────────── */

export async function submitChangeRequest(db: DB, key: string, bookingId: number, message: string) {
  const text = message.trim();
  if (text.length < 5) throw new BookingError(400, 'Tell us what you’d like to change');
  if (text.length > 1000) throw new BookingError(400, 'Please keep it under 1,000 characters');
  const ids = await guestIdsFor(db, key);
  return db.transaction(async (tx) => {
    const [b] = ids.length ? await tx.select().from(bookings).where(and(eq(bookings.id, bookingId), inArray(bookings.guestId, ids))) : [];
    if (!b) throw new BookingError(404, 'Booking not found');
    if (b.status !== 'confirmed' && b.status !== 'checked_in') throw new BookingError(400, 'This booking can’t be changed online — please call us');
    const [{ open }] = await tx.select({ open: sql<number>`count(*)::int` }).from(changeRequests).where(and(eq(changeRequests.bookingId, b.id), eq(changeRequests.status, 'open')));
    if (Number(open) >= 3) throw new BookingError(429, 'We already have your requests — the front desk will be in touch');
    const [r] = await tx.insert(changeRequests).values({ bookingId: b.id, message: text }).returning();
    await queueChangeRequest(tx, b.id, text);
    await audit(null, 'change_request', r.id, 'create', { bookingId: b.id }, tx);
    return r;
  });
}

/** Open requests for the staff dashboard. */
export async function openChangeRequests(db: DB) {
  return db.select({
    id: changeRequests.id, bookingId: changeRequests.bookingId, message: changeRequests.message, createdAt: changeRequests.createdAt,
    reference: bookings.reference, guestName: guests.fullName, guestPhone: guests.phone, checkIn: bookings.checkIn, checkOut: bookings.checkOut, apartmentName: apartments.name,
  }).from(changeRequests)
    .innerJoin(bookings, eq(bookings.id, changeRequests.bookingId))
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .where(eq(changeRequests.status, 'open'))
    .orderBy(asc(changeRequests.createdAt));
}

/** Close a request; a non-empty response is sent to the guest (email/SMS) and shown in their account. */
export async function answerChangeRequest(db: DB, id: number, response: string, actor: Actor, now = new Date()) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(changeRequests).where(eq(changeRequests.id, id));
    if (!r) throw new BookingError(404, 'Request not found');
    if (r.status !== 'open') throw new BookingError(400, 'This request has already been answered');
    const text = response.trim().slice(0, 2000);
    const [u] = await tx.update(changeRequests).set({ status: 'resolved', response: text, resolvedBy: actor.id, resolvedAt: now }).where(eq(changeRequests.id, id)).returning();
    if (text) await queueChangeRequestReply(tx, r.bookingId, text);
    await audit(actor, 'change_request', id, 'resolve', { bookingId: r.bookingId, replied: !!text }, tx);
    return u;
  });
}

