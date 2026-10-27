import { describe, it, expect, beforeAll } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, bookings, notifications, paymentIntents, policies, siteContent } from '@/lib/db/schema';
import { createHold, startPayment, applySuccessfulCharge, type HoldInput } from '@/lib/booking/engine';
import { deliverQueued, type Senders } from '@/lib/notify';
import { runDailyJobs } from '@/lib/notify/jobs';
import { normalizeGhanaPhone, type SendResult } from '@/lib/notify/providers';
import type { DB } from '@/lib/db';

let db: DB;
let aptId: number;
const NOW = new Date('2027-03-01T10:00:00Z');

const hold = (o: Partial<HoldInput> = {}, now = NOW) => createHold(db, {
  apartmentId: aptId, checkIn: '2027-03-10', checkOut: '2027-03-12', adults: 1, children: 0, paymentMode: 'pay_on_arrival',
  guest: { fullName: 'Kofi <b>Boateng</b>', email: 'kofi@example.com', phone: '024 123 4567' }, ...o,
}, { paystackEnabled: true, now });

const msgs = (bookingId: number) => db.select().from(notifications).where(eq(notifications.bookingId, bookingId));

function fakeSenders(fail: Partial<Record<'email' | 'sms', boolean>> = {}) {
  const sent: { channel: string; to: string }[] = [];
  const result = (channel: 'email' | 'sms'): SendResult =>
    fail[channel] ? { status: 'failed', provider: 'fake', error: 'boom' } : { status: 'sent', provider: 'fake' };
  const senders: Senders = {
    email: async (to) => { sent.push({ channel: 'email', to }); return result('email'); },
    sms: async (to) => { sent.push({ channel: 'sms', to }); return result('sms'); },
  };
  return { senders, sent };
}

beforeAll(async () => {
  db = await testDb();
  await db.update(policies).set({ allowPayOnArrival: true });
  [{ id: aptId }] = await db.select({ id: apartments.id }).from(apartments).where(eq(apartments.slug, 'two-bedroom'));
  await db.insert(siteContent).values({
    key: 'settings.json',
    data: { siteName: 'Bruton Gardens & Apartments', recipientEmail: 'frontdesk@example.com', guestMessages: { phone: '+233 24 000 0000', reviewUrl: 'https://g.page/r/test/review' } },
  });
});

describe('normalizeGhanaPhone', () => {
  it('turns local and formatted numbers into 233…', () => {
    expect(normalizeGhanaPhone('024 123 4567')).toBe('233241234567');
    expect(normalizeGhanaPhone('+233 24 123 4567')).toBe('233241234567');
    expect(normalizeGhanaPhone('00233241234567')).toBe('233241234567');
    expect(normalizeGhanaPhone('241234567')).toBe('233241234567');
    expect(normalizeGhanaPhone('+44 7700 900123')).toBe('447700900123');
    expect(normalizeGhanaPhone('12345')).toBeNull();
    expect(normalizeGhanaPhone(null)).toBeNull();
  });
});

describe('booking confirmation messages', () => {
  it('queues guest email + SMS and a staff alert, inside the booking transaction', async () => {
    const { booking } = await hold();
    const rows = await msgs(booking.id);
    expect(rows.map((r) => `${r.template}:${r.channel}:${r.to}`).sort()).toEqual([
      'booking_confirmed:email:kofi@example.com',
      'booking_confirmed:sms:233241234567',
      'staff_new_booking:email:frontdesk@example.com',
    ]);
    expect(rows.every((r) => r.status === 'queued')).toBe(true);

    const sms = rows.find((r) => r.channel === 'sms')!.body;
    expect(sms).toContain(booking.reference);
    expect(sms).toMatch(/^[\x20-\x7E]*$/); // plain ASCII → GSM-7, cheapest SMS encoding
    expect(sms.length).toBeLessThanOrEqual(306); // at most 2 segments

    const staff = rows.find((r) => r.template === 'staff_new_booking')!.body;
    expect(staff).toContain('Kofi &lt;b&gt;Boateng&lt;/b&gt;');
    expect(staff).not.toContain('<b>Boateng');
  });

  it('queues nothing when the hold is not confirmed', async () => {
    const { booking } = await hold({ checkIn: '2027-03-20', checkOut: '2027-03-21', paymentMode: 'full' });
    expect(await msgs(booking.id)).toHaveLength(0);
  });

  it('includes the online payment in the confirmation, and sends a receipt for later payments', async () => {
    const { booking } = await hold({ checkIn: '2027-04-01', checkOut: '2027-04-03', paymentMode: 'deposit' });
    const { intent } = await startPayment(db, booking.id, 'paystack', NOW);
    await applySuccessfulCharge(db, { reference: intent.reference, amount: intent.amount, currency: 'GHS' }, NOW);
    const confirm = (await msgs(booking.id)).find((r) => r.template === 'booking_confirmed' && r.channel === 'sms')!;
    expect(confirm.body).toContain('Paid GHS');
    expect(confirm.body).toContain('due at check-in');

    // balance paid online later
    const [bal] = await db.insert(paymentIntents).values({ bookingId: booking.id, provider: 'paystack', reference: `${booking.reference}-bal`, amount: booking.totalAmount - booking.amountDueNow }).returning();
    expect(await applySuccessfulCharge(db, { reference: bal.reference, amount: bal.amount, currency: 'GHS' }, NOW)).toBe('recorded');
    const receipts = (await msgs(booking.id)).filter((r) => r.template === 'payment_receipt');
    expect(receipts.map((r) => r.channel)).toEqual(['email']);
  });
});

describe('deliverQueued', () => {
  it('sends each message once and records the result', async () => {
    const { booking } = await hold({ checkIn: '2027-05-01', checkOut: '2027-05-02' });
    const { senders, sent } = fakeSenders();
    await deliverQueued(db, { senders, bookingId: booking.id });
    await deliverQueued(db, { senders, bookingId: booking.id });
    expect(sent).toHaveLength(3);
    const rows = await msgs(booking.id);
    expect(rows.every((r) => r.status === 'sent' && r.attempts === 1 && r.sentAt)).toBe(true);
  });

  it('retries failures until they succeed', async () => {
    const { booking } = await hold({ checkIn: '2027-05-10', checkOut: '2027-05-11' });
    await deliverQueued(db, { senders: fakeSenders({ sms: true }).senders, bookingId: booking.id });
    let [sms] = (await msgs(booking.id)).filter((r) => r.channel === 'sms');
    expect(sms).toMatchObject({ status: 'failed', attempts: 1, error: 'boom' });

    const { senders, sent } = fakeSenders();
    await deliverQueued(db, { senders, bookingId: booking.id });
    expect(sent).toEqual([{ channel: 'sms', to: '233241234567' }]);
    [sms] = (await msgs(booking.id)).filter((r) => r.channel === 'sms');
    expect(sms).toMatchObject({ status: 'sent', attempts: 2 });
  });

  it('marks messages skipped when a provider has no key', async () => {
    const { booking } = await hold({ checkIn: '2027-05-20', checkOut: '2027-05-21' });
    const prev = { a: process.env.ARKESEL_API_KEY, r: process.env.RESEND_API_KEY };
    delete process.env.ARKESEL_API_KEY;
    delete process.env.RESEND_API_KEY;
    await deliverQueued(db, { bookingId: booking.id });
    process.env.ARKESEL_API_KEY = prev.a;
    process.env.RESEND_API_KEY = prev.r;
    const rows = await msgs(booking.id);
    expect(rows.every((r) => r.status === 'skipped')).toBe(true);
  });
});

describe('daily jobs', () => {
  it('sends the pre-arrival reminder once, the day before', async () => {
    const { booking } = await hold({ checkIn: '2027-06-02', checkOut: '2027-06-04' }, new Date('2027-05-20T10:00:00Z'));
    const day = new Date('2027-06-01T08:00:00Z');
    const { senders } = fakeSenders();
    await runDailyJobs(db, { now: day, senders });
    await runDailyJobs(db, { now: day, senders });
    const pre = (await msgs(booking.id)).filter((r) => r.template === 'pre_arrival');
    expect(pre.map((r) => r.channel).sort()).toEqual(['email', 'sms']);
    expect(pre.find((r) => r.channel === 'sms')!.body).toMatch(/^[\x20-\x7E]*$/);
  });

  it('asks direct guests for a review after check-out, but not OTA guests', async () => {
    const out = new Date('2027-07-05T10:00:00Z');
    const { booking: direct } = await hold({ checkIn: '2027-07-01', checkOut: '2027-07-03' });
    const { booking: ota } = await hold({ checkIn: '2027-07-03', checkOut: '2027-07-05' });
    await db.update(bookings).set({ status: 'checked_out', checkedOutAt: out }).where(eq(bookings.id, direct.id));
    await db.update(bookings).set({ status: 'checked_out', checkedOutAt: out, source: 'airbnb' }).where(eq(bookings.id, ota.id));

    await runDailyJobs(db, { now: new Date('2027-07-06T08:00:00Z'), senders: fakeSenders().senders });
    expect((await msgs(direct.id)).filter((r) => r.template === 'review_request')).toHaveLength(1);
    expect((await msgs(ota.id)).filter((r) => r.template === 'review_request')).toHaveLength(0);
    const [d] = await db.select().from(bookings).where(and(eq(bookings.id, direct.id)));
    expect(d.reviewRequestedAt).not.toBeNull();
  });
});
