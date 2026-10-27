/**
 * Notification outbox.
 *   queue*()        — call inside the booking transaction; writes 'queued' rows, sends nothing.
 *   deliverQueued() — call after commit (via next/server `after`) and from the daily cron.
 * So a rolled-back booking never sends a message, and a provider outage never loses one.
 */
import { and, asc, eq, inArray, lt } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { apartments, bookings, eventLeads, guests, notifications, policies, siteContent, viewings } from '@/lib/db/schema';
import { folioPaid } from '@/lib/booking/folio';
import { nightsBetween } from '@/lib/booking/pricing';
import { normalizeGhanaPhone, sendEmail, sendSms, type SendResult } from './providers';
import * as t from './templates';
import type { BookingMessageData, EventChange, EventMessageData, SiteInfo, ViewingChange, ViewingMessageData } from './templates';

const MAX_ATTEMPTS = 5;
const RETRYABLE = ['queued', 'failed'];

/** Fallbacks until the owner fills in Settings → Guest messages. */
const DEFAULT_DIRECTIONS = 'https://maps.app.goo.gl/uAjiMzC2AW4HJxGJ9';

type Template =
  | 'booking_confirmed' | 'payment_receipt' | 'pre_arrival' | 'review_request' | 'staff_new_booking'
  | 'viewing_booked' | 'viewing_rescheduled' | 'viewing_cancelled' | 'staff_new_viewing'
  | 'event_received' | 'event_quoted' | 'event_deposit' | 'event_confirmed' | 'staff_new_event'
  | 'booking_changed' | 'booking_cancelled' | 'staff_change_request' | 'change_request_reply';

type Settings = {
  siteName?: string;
  recipientEmail?: string;
  guestMessages?: { phone?: string; directionsUrl?: string; arrivalNote?: string; reviewUrl?: string; eventDepositInstructions?: string };
};

async function readSettings(db: DB | Tx): Promise<Settings> {
  const [row] = await db.select().from(siteContent).where(eq(siteContent.key, 'settings.json'));
  return (row?.data as Settings) ?? {};
}

function reviewUrlFallback() {
  const placeId = process.env.GOOGLE_PLACE_ID;
  return placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : '';
}

export async function loadSite(db: DB | Tx): Promise<{ site: SiteInfo; staffEmail: string }> {
  const settings = await readSettings(db);
  const gm = settings.guestMessages ?? {};
  return {
    staffEmail: settings.recipientEmail ?? '',
    site: {
      name: settings.siteName || 'Bruton Gardens & Apartments',
      url: (process.env.SITE_URL || 'https://brutongardens.com').replace(/\/$/, ''),
      phone: gm.phone ?? '',
      directionsUrl: gm.directionsUrl || DEFAULT_DIRECTIONS,
      arrivalNote: gm.arrivalNote ?? '',
      reviewUrl: gm.reviewUrl || reviewUrlFallback(),
      eventDepositInstructions: gm.eventDepositInstructions ?? '',
    },
  };
}

export async function loadBookingMessageData(db: DB | Tx, bookingId: number): Promise<BookingMessageData & { staffEmail: string }> {
  const [row] = await db.select({ b: bookings, aptName: apartments.name, g: guests })
    .from(bookings)
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .where(eq(bookings.id, bookingId));
  if (!row) throw new Error(`Booking ${bookingId} not found`);
  const [[policy], paid, { site, staffEmail }] = await Promise.all([
    db.select().from(policies).where(eq(policies.id, 1)),
    folioPaid(db, bookingId),
    loadSite(db),
  ]);
  const { b, g } = row;
  return {
    reference: b.reference,
    guestName: g.fullName,
    guestEmail: g.email,
    guestPhone: g.phone,
    apartmentName: row.aptName,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: nightsBetween(b.checkIn, b.checkOut),
    guests: b.adults + b.children,
    total: b.totalAmount,
    paid,
    paymentMode: b.paymentMode,
    source: b.source,
    notes: b.notes,
    checkInTime: policy?.checkInTime ?? '14:00',
    checkOutTime: policy?.checkOutTime ?? '11:00',
    cancellationText: policy?.cancellationText ?? '',
    staffEmail,
    site,
  };
}

type Outgoing =
  | { channel: 'email'; to: string; template: Template; email: t.EmailMessage }
  | { channel: 'sms'; to: string; template: Template; text: string };

type Subject = { bookingId?: number; viewingId?: number; eventLeadId?: number };

async function enqueue(tx: Tx, subject: number | Subject, msgs: Outgoing[]) {
  if (msgs.length === 0) return;
  const link = typeof subject === 'number' ? { bookingId: subject } : subject;
  await tx.insert(notifications).values(msgs.map((m) => ({
    ...link,
    channel: m.channel,
    to: m.to,
    template: m.template,
    subject: m.channel === 'email' ? m.email.subject : null,
    body: m.channel === 'email' ? m.email.html : m.text,
    provider: m.channel === 'email' ? 'resend' : 'arkesel',
    status: 'queued',
  })));
}

function toGuest(d: { guestEmail: string | null; guestPhone: string | null }, template: Template, email?: t.EmailMessage, sms?: string): Outgoing[] {
  const out: Outgoing[] = [];
  if (email && d.guestEmail) out.push({ channel: 'email', to: d.guestEmail, template, email });
  const phone = normalizeGhanaPhone(d.guestPhone);
  if (sms && phone) out.push({ channel: 'sms', to: phone, template, text: sms });
  return out;
}

export async function queueBookingConfirmed(tx: Tx, bookingId: number) {
  const d = await loadBookingMessageData(tx, bookingId);
  const msgs = toGuest(d, 'booking_confirmed', t.bookingConfirmedEmail(d), t.bookingConfirmedSms(d));
  if (d.staffEmail) msgs.push({ channel: 'email', to: d.staffEmail, template: 'staff_new_booking', email: t.staffNewBookingEmail(d) });
  await enqueue(tx, bookingId, msgs);
}

export async function queueChangeRequest(tx: Tx, bookingId: number, message: string) {
  const d = await loadBookingMessageData(tx, bookingId);
  if (d.staffEmail) await enqueue(tx, bookingId, [{ channel: 'email', to: d.staffEmail, template: 'staff_change_request', email: t.staffChangeRequestEmail(d, message) }]);
}

export async function queueChangeRequestReply(tx: Tx, bookingId: number, response: string) {
  const d = await loadBookingMessageData(tx, bookingId);
  await enqueue(tx, bookingId, toGuest(d, 'change_request_reply', t.changeRequestReplyEmail(d, response), t.changeRequestReplySms(d)));
}

export async function queueBookingChanged(tx: Tx, bookingId: number, change: 'changed' | 'cancelled') {
  const d = await loadBookingMessageData(tx, bookingId);
  const msgs = change === 'changed'
    ? toGuest(d, 'booking_changed', t.bookingChangedEmail(d), t.bookingChangedSms(d))
    : toGuest(d, 'booking_cancelled', t.bookingCancelledEmail(d), t.bookingCancelledSms(d));
  await enqueue(tx, bookingId, msgs);
}

export async function queuePaymentReceipt(tx: Tx, bookingId: number, payment: { amount: number; method: string; reference: string }) {
  const d = await loadBookingMessageData(tx, bookingId);
  await enqueue(tx, bookingId, toGuest(d, 'payment_receipt', t.paymentReceiptEmail(d, payment)));
}

export async function queuePreArrival(tx: Tx, bookingId: number) {
  const d = await loadBookingMessageData(tx, bookingId);
  await enqueue(tx, bookingId, toGuest(d, 'pre_arrival', t.preArrivalEmail(d), t.preArrivalSms(d)));
}

/** Returns false (and queues nothing) when there's no review link configured. */
export async function queueReviewRequest(tx: Tx, bookingId: number) {
  const d = await loadBookingMessageData(tx, bookingId);
  if (!d.site.reviewUrl) return false;
  await enqueue(tx, bookingId, toGuest(d, 'review_request', t.reviewRequestEmail(d)));
  return true;
}

export async function queueViewingMessages(tx: Tx, viewingId: number, change: ViewingChange) {
  const [v] = await tx.select().from(viewings).where(eq(viewings.id, viewingId));
  if (!v) throw new Error(`Viewing ${viewingId} not found`);
  const { site, staffEmail } = await loadSite(tx);
  const d: ViewingMessageData = {
    name: v.name, guestEmail: v.email, guestPhone: v.phone, type: v.type === 'virtual' ? 'virtual' : 'physical',
    scheduledAt: v.scheduledAt, notes: v.notes, site,
  };
  const template = `viewing_${change}` as Template;
  const msgs = toGuest(d, template, t.viewingEmail(d, change), t.viewingSms(d, change));
  if (change === 'booked' && staffEmail) msgs.push({ channel: 'email', to: staffEmail, template: 'staff_new_viewing', email: t.staffNewViewingEmail(d) });
  await enqueue(tx, { viewingId }, msgs);
}

export async function queueEventMessages(tx: Tx, eventLeadId: number, change: EventChange) {
  const [e] = await tx.select().from(eventLeads).where(eq(eventLeads.id, eventLeadId));
  if (!e) throw new Error(`Event lead ${eventLeadId} not found`);
  const { site, staffEmail } = await loadSite(tx);
  const d: EventMessageData = {
    reference: e.reference, name: e.name, guestEmail: e.email, guestPhone: e.phone, eventType: e.eventType,
    eventDate: e.eventDate, headcount: e.headcount, cateringRequired: e.cateringRequired, quoteAmount: e.quoteAmount,
    depositAmount: e.depositAmount, depositPaidAmount: e.depositPaidAmount, quoteNotes: e.quoteNotes, notes: e.notes, site,
  };
  const msgs = toGuest(d, `event_${change}` as Template, t.eventEmail(d, change), t.eventSms(d, change));
  if (change === 'received' && staffEmail) msgs.push({ channel: 'email', to: staffEmail, template: 'staff_new_event', email: t.staffNewEventEmail(d) });
  await enqueue(tx, { eventLeadId }, msgs);
}

/* ── Delivery ──────────────────────────────────────────────────────────── */

export type Senders = {
  email: (to: string, subject: string, html: string) => Promise<SendResult>;
  sms: (to: string, text: string) => Promise<SendResult>;
};
const defaultSenders: Senders = { email: sendEmail, sms: sendSms };

/**
 * Send whatever is queued (and retry failures). Each row is claimed with a conditional
 * update first, so two overlapping runs can't send the same message twice.
 */
export async function deliverQueued(db: DB, opts: { limit?: number; senders?: Senders; bookingId?: number; viewingId?: number; eventLeadId?: number } = {}) {
  const senders = opts.senders ?? defaultSenders;
  const pending = await db.select({ id: notifications.id }).from(notifications)
    .where(and(
      inArray(notifications.status, RETRYABLE),
      lt(notifications.attempts, MAX_ATTEMPTS),
      ...(opts.bookingId ? [eq(notifications.bookingId, opts.bookingId)] : []),
      ...(opts.viewingId ? [eq(notifications.viewingId, opts.viewingId)] : []),
      ...(opts.eventLeadId ? [eq(notifications.eventLeadId, opts.eventLeadId)] : []),
    ))
    .orderBy(asc(notifications.id))
    .limit(opts.limit ?? 50);

  const counts = { sent: 0, failed: 0, skipped: 0 };
  for (const { id } of pending) {
    const [msg] = await db.update(notifications)
      .set({ status: 'sending' })
      .where(and(eq(notifications.id, id), inArray(notifications.status, RETRYABLE)))
      .returning();
    if (!msg) continue;

    const result = msg.channel === 'email'
      ? await senders.email(msg.to, msg.subject ?? '', msg.body)
      : await senders.sms(msg.to, msg.body);

    await db.update(notifications).set({
      status: result.status,
      provider: result.provider,
      error: result.error ?? null,
      attempts: msg.attempts + 1,
      sentAt: result.status === 'sent' ? new Date() : null,
    }).where(eq(notifications.id, id));
    counts[result.status]++;
    if (result.status === 'failed') console.warn(`[notify] ${msg.channel} ${msg.template} to ${msg.to} failed: ${result.error}`);
  }
  return counts;
}
