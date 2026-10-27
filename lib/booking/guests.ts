/**
 * Guest records — plan §4: profile, contacts, ID, stay history, notes; merged across
 * direct and channel bookings.
 *
 * Merging moves the duplicate's bookings onto the kept guest and marks the duplicate with
 * mergedIntoId, so old links still resolve and nothing is deleted.
 */
import { and, asc, desc, eq, ilike, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { apartments, bookings, folioEntries, guests } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from './engine';

type Actor = { id: number; name: string };

/** Last 9 digits of a phone number, so 0244…, 233244… and +233 244… compare equal. */
const PHONE_KEY = sql<string>`right(regexp_replace(coalesce(${guests.phone}, ''), '[^0-9]', '', 'g'), 9)`;
const EMAIL_KEY = sql<string>`lower(trim(${guests.email}))`;
const like = (q: string) => `%${q.replace(/[%_\\]/g, '')}%`;

const paidOn = (bookingIds: ReturnType<typeof sql>) =>
  sql<number>`coalesce((select sum(case when ${folioEntries.type} = 'payment' then ${folioEntries.amount} when ${folioEntries.type} = 'refund' then -${folioEntries.amount} else 0 end) from ${folioEntries} where ${folioEntries.bookingId} in ${bookingIds}), 0)::int`;

/* ── List ──────────────────────────────────────────────────────────────── */

export async function guestList(db: DB, opts: { q?: string; limit?: number } = {}) {
  const q = opts.q?.trim();
  const stays = sql`(select ${bookings.id} from ${bookings} where ${bookings.guestId} = ${guests.id} and ${bookings.status} in ('confirmed', 'checked_in', 'checked_out'))`;
  const rows = await db.select({
    id: guests.id, fullName: guests.fullName, phone: guests.phone, email: guests.email, nationality: guests.nationality,
    createdAt: guests.createdAt,
    stays: sql<number>`(select count(*) from ${stays} s)::int`,
    lastStay: sql<string | null>`(select max(${bookings.checkIn}) from ${bookings} where ${bookings.guestId} = ${guests.id} and ${bookings.status} in ('confirmed', 'checked_in', 'checked_out'))`,
    paid: paidOn(stays),
  }).from(guests)
    .where(and(
      isNull(guests.mergedIntoId),
      q ? or(ilike(guests.fullName, like(q)), ilike(guests.phone, like(q)), ilike(guests.email, like(q))) : undefined,
    ))
    .orderBy(desc(guests.id))
    .limit(opts.limit ?? 100);
  return rows.map((r) => ({ ...r, stays: Number(r.stays), paid: Number(r.paid) }));
}

/** Groups of active guests sharing an email or phone number — likely the same person. */
export async function duplicateGroups(db: DB) {
  const active = await db.select({ id: guests.id, fullName: guests.fullName, phone: guests.phone, email: guests.email, phoneKey: PHONE_KEY, emailKey: EMAIL_KEY })
    .from(guests).where(isNull(guests.mergedIntoId)).orderBy(asc(guests.id));

  const groups = new Map<string, typeof active>();
  for (const g of active) {
    const keys = [g.emailKey ? `e:${g.emailKey}` : null, g.phoneKey && g.phoneKey.length === 9 ? `p:${g.phoneKey}` : null].filter(Boolean) as string[];
    for (const k of keys) groups.set(k, [...(groups.get(k) ?? []), g]);
  }
  // A pair matching on both email and phone shows once.
  const seen = new Set<string>();
  const out: { match: 'email' | 'phone'; guests: { id: number; fullName: string; phone: string | null; email: string | null }[] }[] = [];
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const ids = list.map((g) => g.id).join(',');
    if (seen.has(ids)) continue;
    seen.add(ids);
    out.push({ match: key.startsWith('e:') ? 'email' : 'phone', guests: list.map(({ id, fullName, phone, email }) => ({ id, fullName, phone, email })) });
  }
  return out;
}

/* ── Profile ───────────────────────────────────────────────────────────── */

export async function guestProfile(db: DB, id: number) {
  const [g] = await db.select().from(guests).where(eq(guests.id, id));
  if (!g) throw new BookingError(404, 'Guest not found');
  if (g.mergedIntoId) return { mergedIntoId: g.mergedIntoId } as const;

  const stays = await db.select({
    id: bookings.id, reference: bookings.reference, status: bookings.status, source: bookings.source,
    checkIn: bookings.checkIn, checkOut: bookings.checkOut, apartmentName: apartments.name, totalAmount: bookings.totalAmount,
    balance: sql<number>`coalesce((select sum(case when ${folioEntries.type} = 'payment' then -${folioEntries.amount} else ${folioEntries.amount} end) from ${folioEntries} where ${folioEntries.bookingId} = ${bookings.id}), 0)::int`,
    paid: sql<number>`coalesce((select sum(case when ${folioEntries.type} = 'payment' then ${folioEntries.amount} when ${folioEntries.type} = 'refund' then -${folioEntries.amount} else 0 end) from ${folioEntries} where ${folioEntries.bookingId} = ${bookings.id}), 0)::int`,
  }).from(bookings)
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .where(eq(bookings.guestId, id))
    .orderBy(desc(bookings.checkIn));

  const phoneKey = (g.phone ?? '').replace(/\D/g, '').slice(-9);
  const email = g.email?.trim().toLowerCase();
  const possibleDuplicates = (email || phoneKey.length === 9)
    ? await db.select({ id: guests.id, fullName: guests.fullName, phone: guests.phone, email: guests.email }).from(guests)
      .where(and(isNull(guests.mergedIntoId), ne(guests.id, id), or(
        email ? eq(EMAIL_KEY, email) : undefined,
        phoneKey.length === 9 ? eq(PHONE_KEY, phoneKey) : undefined,
      )))
    : [];

  const rows = stays.map((s) => ({ ...s, balance: Number(s.balance), paid: Number(s.paid) }));
  const counted = rows.filter((s) => ['confirmed', 'checked_in', 'checked_out'].includes(s.status));
  return {
    guest: g,
    stays: rows,
    summary: {
      stays: counted.length,
      nights: counted.reduce((n, s) => n + Math.round((Date.parse(s.checkOut) - Date.parse(s.checkIn)) / 86_400_000), 0),
      paid: rows.reduce((n, s) => n + s.paid, 0),
      owing: rows.reduce((n, s) => n + Math.max(s.balance, 0), 0),
    },
    possibleDuplicates,
  };
}

/* ── Edit ──────────────────────────────────────────────────────────────── */

export type GuestPatch = Partial<Pick<typeof guests.$inferInsert, 'fullName' | 'email' | 'phone' | 'nationality' | 'idType' | 'idNumber' | 'notes'>>;

export async function updateGuest(db: DB, id: number, patch: GuestPatch, actor: Actor) {
  const clean = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, typeof v === 'string' ? (v.trim() || (k === 'notes' ? '' : null)) : v]));
  if ('fullName' in clean && !clean.fullName) throw new BookingError(400, 'The guest needs a name');
  if (typeof clean.email === 'string') clean.email = clean.email.toLowerCase();
  return db.transaction(async (tx) => {
    const [g] = await tx.select().from(guests).where(eq(guests.id, id));
    if (!g) throw new BookingError(404, 'Guest not found');
    if (g.mergedIntoId) throw new BookingError(400, 'This guest was merged into another record');
    const [updated] = await tx.update(guests).set(clean).where(eq(guests.id, id)).returning();
    // Field names only for ID details (Data Protection Act: keep personal data out of the log).
    const changed = Object.keys(clean).filter((k) => (g as Record<string, unknown>)[k] !== clean[k]);
    if (changed.length) await audit(actor, 'guest', id, 'update', { fields: changed }, tx);
    return updated;
  });
}

/* ── Merge ─────────────────────────────────────────────────────────────── */

/** Fold `dropId` into `keepId`: bookings move across, blank fields are filled, notes combined. */
export async function mergeGuests(db: DB, keepId: number, dropId: number, actor: Actor) {
  if (keepId === dropId) throw new BookingError(400, 'Choose two different guests');
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(guests).where(inArray(guests.id, [keepId, dropId]));
    const keep = rows.find((g) => g.id === keepId);
    const drop = rows.find((g) => g.id === dropId);
    if (!keep || !drop) throw new BookingError(404, 'Guest not found');
    if (keep.mergedIntoId || drop.mergedIntoId) throw new BookingError(400, 'One of these guests has already been merged');

    const moved = await tx.update(bookings).set({ guestId: keepId }).where(eq(bookings.guestId, dropId)).returning({ id: bookings.id });
    const fill = <K extends 'email' | 'phone' | 'nationality' | 'idType' | 'idNumber'>(k: K) => (keep[k] ? {} : drop[k] ? { [k]: drop[k] } : {});
    await tx.update(guests).set({
      ...fill('email'), ...fill('phone'), ...fill('nationality'), ...fill('idType'), ...fill('idNumber'),
      notes: [keep.notes, drop.notes].map((n) => n.trim()).filter(Boolean).join('\n'),
    }).where(eq(guests.id, keepId));
    await tx.update(guests).set({ mergedIntoId: keepId }).where(eq(guests.id, dropId));

    await audit(actor, 'guest', keepId, 'merge', { mergedFrom: dropId, bookingsMoved: moved.length }, tx);
    return { keepId, bookingsMoved: moved.length };
  });
}
