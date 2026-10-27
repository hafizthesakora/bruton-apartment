/**
 * Event centre pipeline — plan §4: lead → quoted → deposit_paid → confirmed (side exit: lost).
 * Each guest-facing step queues its email + SMS in the same transaction as the change.
 */
import crypto from 'crypto';
import { and, asc, eq, gte, inArray, ne } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { eventLeads } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from '@/lib/booking/engine';
import { isISODate, nightsBetween, todayAtProperty } from '@/lib/booking/pricing';
import { queueEventMessages } from '@/lib/notify';

export type EventLead = typeof eventLeads.$inferSelect;
export type Stage = EventLead['stage'];
type Actor = { id: number | null; name: string };

/** Stages that hold the date on the event calendar. */
export const BOOKED_STAGES = ['deposit_paid', 'confirmed'] as const;
const MAX_DAYS_AHEAD = 730;

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newEventReference() {
  let s = 'EV';
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
  return s;
}

function validateEventDate(date: string, now: Date) {
  if (!isISODate(date)) throw new BookingError(400, 'Choose a valid event date');
  const days = nightsBetween(todayAtProperty(now), date);
  if (days < 0) throw new BookingError(400, 'The event date can’t be in the past');
  if (days > MAX_DAYS_AHEAD) throw new BookingError(400, 'Please contact us directly for events more than two years ahead');
}

export type EnquiryInput = {
  name: string;
  phone: string;
  email?: string | null;
  eventDate: string;
  eventType: string;
  headcount: number;
  cateringRequired?: boolean;
  notes?: string;
};

/** Website enquiries message the guest + staff; leads staff take by phone don't. */
export async function createEventLead(db: DB, input: EnquiryInput, opts: { actor?: Actor; source?: 'website' | 'phone' | 'walk_in'; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const source = opts.source ?? 'website';
  validateEventDate(input.eventDate, now);
  return db.transaction(async (tx) => {
    const [lead] = await tx.insert(eventLeads).values({
      reference: newEventReference(),
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim().toLowerCase() || null,
      eventDate: input.eventDate,
      eventType: input.eventType.trim(),
      headcount: input.headcount,
      cateringRequired: !!input.cateringRequired,
      notes: input.notes?.trim() ?? '',
      source,
    }).returning();
    await audit(opts.actor ?? { id: null, name: 'Website' }, 'event', lead.id, 'create', { reference: lead.reference, date: lead.eventDate }, tx);
    if (source === 'website') await queueEventMessages(tx, lead.id, 'received');
    return lead;
  });
}

async function load(db: DB, id: number) {
  const [lead] = await db.select().from(eventLeads).where(eq(eventLeads.id, id));
  if (!lead) throw new BookingError(404, 'Event not found');
  return lead;
}

function requireStage(lead: EventLead, allowed: Stage[], action: string) {
  if (!allowed.includes(lead.stage)) throw new BookingError(400, `Can’t ${action} an event that is ${lead.stage.replace('_', ' ')}`);
}

/** Send (or re-send, after changes) the quote. Allowed until the deposit is in. */
export async function sendQuote(db: DB, id: number, q: { quoteAmount: number; depositAmount: number; quoteNotes?: string }, actor: Actor, now = new Date()) {
  if (q.quoteAmount <= 0) throw new BookingError(400, 'Enter the quote amount');
  if (q.depositAmount < 0 || q.depositAmount > q.quoteAmount) throw new BookingError(400, 'The deposit must be between zero and the quote amount');
  const lead = await load(db, id);
  requireStage(lead, ['lead', 'quoted'], 'quote');
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(eventLeads).set({
      stage: 'quoted', quoteAmount: q.quoteAmount, depositAmount: q.depositAmount,
      quoteNotes: q.quoteNotes?.trim() ?? lead.quoteNotes, quotedAt: now, updatedAt: now,
    }).where(eq(eventLeads.id, id)).returning();
    await audit(actor, 'event', id, lead.stage === 'quoted' ? 'requote' : 'quote', { quoteAmount: q.quoteAmount, depositAmount: q.depositAmount }, tx);
    await queueEventMessages(tx, id, 'quoted');
    return updated;
  });
}

/** Record a deposit (cash / MoMo / transfer taken by staff). Further payments add up. */
export async function recordDeposit(db: DB, id: number, pay: { amount: number; method: 'cash' | 'momo' | 'transfer' | 'card'; reference?: string }, actor: Actor, now = new Date()) {
  if (pay.amount <= 0) throw new BookingError(400, 'Enter the amount received');
  const lead = await load(db, id);
  requireStage(lead, ['quoted', 'deposit_paid', 'confirmed'], 'record a payment for');
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(eventLeads).set({
      stage: lead.stage === 'quoted' ? 'deposit_paid' : lead.stage,
      depositPaidAmount: lead.depositPaidAmount + pay.amount,
      depositMethod: pay.method,
      depositReference: pay.reference?.trim() || lead.depositReference,
      depositPaidAt: lead.depositPaidAt ?? now,
      updatedAt: now,
    }).where(eq(eventLeads.id, id)).returning();
    await audit(actor, 'event', id, 'payment', { amount: pay.amount, method: pay.method, reference: pay.reference }, tx);
    await queueEventMessages(tx, id, 'deposit');
    return updated;
  });
}

/** Final confirmation. Normally after the deposit; owners/managers may confirm a quoted event directly. */
export async function confirmEvent(db: DB, id: number, actor: Actor, now = new Date()) {
  const lead = await load(db, id);
  requireStage(lead, ['quoted', 'deposit_paid'], 'confirm');
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(eventLeads).set({ stage: 'confirmed', confirmedAt: now, updatedAt: now })
      .where(eq(eventLeads.id, id)).returning();
    await audit(actor, 'event', id, 'confirm', { from: lead.stage }, tx);
    await queueEventMessages(tx, id, 'confirmed');
    return updated;
  });
}

export async function markLost(db: DB, id: number, reason: string, actor: Actor, now = new Date()) {
  const lead = await load(db, id);
  requireStage(lead, ['lead', 'quoted', 'deposit_paid', 'confirmed'], 'close');
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(eventLeads).set({ stage: 'lost', lostReason: reason.trim(), updatedAt: now })
      .where(eq(eventLeads.id, id)).returning();
    await audit(actor, 'event', id, 'lost', { from: lead.stage, reason, depositPaid: lead.depositPaidAmount }, tx);
    return updated;
  });
}

/** Re-open a lost lead at the start of the pipeline (e.g. the client came back). */
export async function reopenLead(db: DB, id: number, actor: Actor, now = new Date()) {
  const lead = await load(db, id);
  requireStage(lead, ['lost'], 're-open');
  return db.transaction(async (tx) => {
    const stage: Stage = lead.depositPaidAmount > 0 ? 'deposit_paid' : lead.quoteAmount != null ? 'quoted' : 'lead';
    const [updated] = await tx.update(eventLeads).set({ stage, lostReason: '', updatedAt: now }).where(eq(eventLeads.id, id)).returning();
    await audit(actor, 'event', id, 'reopen', { to: stage }, tx);
    return updated;
  });
}

export type DetailsPatch = Partial<Pick<EventLead, 'eventDate' | 'eventType' | 'headcount' | 'cateringRequired' | 'cateringNotes' | 'staffNotes' | 'name' | 'phone' | 'email'>>;

export async function updateDetails(db: DB, id: number, patch: DetailsPatch, actor: Actor, now = new Date()) {
  const lead = await load(db, id);
  if (patch.eventDate && patch.eventDate !== lead.eventDate) validateEventDate(patch.eventDate, now);
  const [updated] = await db.update(eventLeads).set({ ...patch, updatedAt: now }).where(eq(eventLeads.id, id)).returning();
  const changed = Object.fromEntries(Object.entries(patch).filter(([k, v]) => lead[k as keyof EventLead] !== v));
  if (Object.keys(changed).length) await audit(actor, 'event', id, 'update', changed, db);
  return updated;
}

/** Everything not lost, plus recent losses; and for each lead, other events already holding its date. */
export async function listEventLeads(db: DB, now = new Date()) {
  const today = todayAtProperty(now);
  const rows = await db.select().from(eventLeads)
    .where(and(gte(eventLeads.eventDate, today)))
    .orderBy(asc(eventLeads.eventDate), asc(eventLeads.id));
  const booked = rows.filter((r) => (BOOKED_STAGES as readonly string[]).includes(r.stage));
  return rows.map((r) => ({
    ...r,
    clashes: booked.filter((b) => b.id !== r.id && b.eventDate === r.eventDate).map((b) => b.reference),
  }));
}

/** Booked events on a date (for the enquiry form's "that date is popular" hint). */
export async function bookedOnDate(db: DB, date: string, excludeId?: number) {
  return db.select({ id: eventLeads.id }).from(eventLeads).where(and(
    eq(eventLeads.eventDate, date),
    inArray(eventLeads.stage, [...BOOKED_STAGES]),
    ...(excludeId ? [ne(eventLeads.id, excludeId)] : []),
  ));
}
