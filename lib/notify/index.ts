/**
 * Notification outbox.
 *   queue*()        — call inside the booking transaction; writes 'queued' rows, sends nothing.
 *   deliverQueued() — call after commit (via next/server `after`) and from the daily cron.
 * So a rolled-back booking never sends a message, and a provider outage never loses one.
 */
import { and, asc, eq, inArray, lt } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { apartments, bookings, guests, notifications, policies, siteContent } from '@/lib/db/schema';
import { folioPaid } from '@/lib/booking/folio';
import { nightsBetween } from '@/lib/booking/pricing';
import { normalizeGhanaPhone, sendEmail, sendSms, type SendResult } from './providers';
import * as t from './templates';
import type { BookingMessageData } from './templates';

const MAX_ATTEMPTS = 5;
const RETRYABLE = ['queued', 'failed'];

/** Fallbacks until the owner fills in Settings → Guest messages. */
const DEFAULT_DIRECTIONS = 'https://maps.app.goo.gl/uAjiMzC2AW4HJxGJ9';

type Template = 'booking_confirmed' | 'payment_receipt' | 'pre_arrival' | 'review_request' | 'staff_new_booking';

type Settings = {
  siteName?: string;
  recipientEmail?: string;
  guestMessages?: { phone?: string; directionsUrl?: string; arrivalNote?: string; reviewUrl?: string };
};

async function readSettings(db: DB | Tx): Promise<Settings> {
  const [row] = await db.select().from(siteContent).where(eq(siteContent.key, 'settings.json'));
  return (row?.data as Settings) ?? {};
}

function reviewUrlFallback() {
  const placeId = process.env.GOOGLE_PLACE_ID;
  return placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : '';
}

export async function loadBookingMessageData(db: DB | Tx, bookingId: number): Promise<BookingMessageData & { staffEmail: string }> {
  const [row] = await db.select({ b: bookings, aptName: apartments.name, g: guests })
    .from(bookings)
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .where(eq(bookings.id, bookingId));
  if (!row) throw new Error(`Booking ${bookingId} not found`);
  const [[policy], paid, settings] = await Promise.all([
    db.select().from(policies).where(eq(policies.id, 1)),
    folioPaid(db, bookingId),
    readSettings(db),
  ]);
  const gm = settings.guestMessages ?? {};
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
    staffEmail: settings.recipientEmail ?? '',
    site: {
      name: settings.siteName || 'Bruton Gardens & Apartments',
      url: (process.env.SITE_URL || 'https://brutongardens.com').replace(/\/$/, ''),
      phone: gm.phone ?? '',
      directionsUrl: gm.directionsUrl || DEFAULT_DIRECTIONS,
      arrivalNote: gm.arrivalNote ?? '',
      reviewUrl: gm.reviewUrl || reviewUrlFallback(),
    },
  };
}

type Outgoing =
  | { channel: 'email'; to: string; template: Template; email: t.EmailMessage }
  | { channel: 'sms'; to: string; template: Template; text: string };

async function enqueue(tx: Tx, bookingId: number, msgs: Outgoing[]) {
  if (msgs.length === 0) return;
  await tx.insert(notifications).values(msgs.map((m) => ({
    bookingId,
    channel: m.channel,
    to: m.to,
    template: m.template,
    subject: m.channel === 'email' ? m.email.subject : null,
    body: m.channel === 'email' ? m.email.html : m.text,
    provider: m.channel === 'email' ? 'resend' : 'arkesel',
    status: 'queued',
  })));
}

function toGuest(d: BookingMessageData, template: Template, email?: t.EmailMessage, sms?: string): Outgoing[] {
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
export async function deliverQueued(db: DB, opts: { limit?: number; senders?: Senders; bookingId?: number } = {}) {
  const senders = opts.senders ?? defaultSenders;
  const pending = await db.select({ id: notifications.id }).from(notifications)
    .where(and(
      inArray(notifications.status, RETRYABLE),
      lt(notifications.attempts, MAX_ATTEMPTS),
      ...(opts.bookingId ? [eq(notifications.bookingId, opts.bookingId)] : []),
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
