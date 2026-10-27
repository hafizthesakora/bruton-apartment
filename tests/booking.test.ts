import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { alerts, apartments, bookings, folioEntries, housekeepingStatus } from '@/lib/db/schema';
import {
  searchAvailability, createHold, startPayment, applySuccessfulCharge, expireHolds,
  getBookingForGuest, BookingError, type HoldInput,
} from '@/lib/booking/engine';
import { verifySignature } from '@/lib/payments/paystack';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
let suite: number;
const NOW = new Date('2027-03-01T10:00:00Z');
const later = (min: number) => new Date(NOW.getTime() + min * 60_000);

const hold = (o: Partial<HoldInput> = {}, paystackEnabled = true, now = NOW) => createHold(db, {
  apartmentId: studio, checkIn: '2027-03-10', checkOut: '2027-03-12', adults: 2, children: 0,
  paymentMode: 'full', guest: { fullName: 'Ama Mensah', email: 'Ama@Example.com', phone: '+233200000000' },
  ...o,
}, { paystackEnabled, now });

beforeAll(async () => {
  db = await testDb();
  const rows = await db.select().from(apartments);
  studio = rows.find((a) => a.slug === 'studio')!.id;
  suite = rows.find((a) => a.slug === 'executive-suite')!.id;
});

describe('availability search', () => {
  it('quotes every apartment that fits the party', async () => {
    const res = await searchAvailability(db, { checkIn: '2027-04-01', checkOut: '2027-04-03', guests: 4 }, NOW);
    expect(res.find((a) => a.id === studio)).toMatchObject({ available: false, reason: 'Sleeps up to 2' });
    expect(res.find((a) => a.id === suite)?.quote?.nights).toBe(2);
  });

  it('rejects past dates', async () => {
    await expect(searchAvailability(db, { checkIn: '2027-02-01', checkOut: '2027-02-03', guests: 1 }, NOW)).rejects.toThrow(BookingError);
  });

  it('hides out-of-order apartments', async () => {
    await db.update(housekeepingStatus).set({ status: 'out_of_order' }).where(eq(housekeepingStatus.apartmentId, suite));
    const res = await searchAvailability(db, { checkIn: '2027-04-01', checkOut: '2027-04-03', guests: 1 }, NOW);
    expect(res.find((a) => a.id === suite)?.available).toBe(false);
    await db.update(housekeepingStatus).set({ status: 'clean' }).where(eq(housekeepingStatus.apartmentId, suite));
  });
});

describe('holds', () => {
  it('blocks the dates while held, and frees them when the hold lapses', async () => {
    const { booking } = await hold({ checkIn: '2027-05-01', checkOut: '2027-05-03' });
    expect(booking.status).toBe('held');
    expect(booking.amountDueNow).toBe(booking.totalAmount);

    await expect(hold({ checkIn: '2027-05-02', checkOut: '2027-05-04' })).rejects.toMatchObject({ status: 409 });
    const during = await searchAvailability(db, { checkIn: '2027-05-01', checkOut: '2027-05-02', guests: 1 }, NOW);
    expect(during.find((a) => a.id === studio)?.available).toBe(false);

    const after = later(16);
    await expireHolds(db, after);
    await expect(hold({ checkIn: '2027-05-02', checkOut: '2027-05-04' }, true, after)).resolves.toBeTruthy();
  });

  it('reuses the guest record by email', async () => {
    const a = await hold({ checkIn: '2027-06-01', checkOut: '2027-06-02' });
    const b = await hold({ checkIn: '2027-06-05', checkOut: '2027-06-06', guest: { fullName: 'Ama M', email: 'ama@example.com', phone: '' } });
    expect(b.booking.guestId).toBe(a.booking.guestId);
  });

  it('only allows pay-on-arrival until Paystack is configured', async () => {
    await expect(hold({ checkIn: '2027-06-10', checkOut: '2027-06-11' }, false)).rejects.toMatchObject({ status: 400 });
    const { booking } = await hold({ checkIn: '2027-06-10', checkOut: '2027-06-11', paymentMode: 'pay_on_arrival' }, false);
    expect(booking.status).toBe('confirmed');
    expect(booking.amountDueNow).toBe(0);
    const folio = await db.select().from(folioEntries).where(eq(folioEntries.bookingId, booking.id));
    expect(folio).toMatchObject([{ type: 'charge', amount: booking.totalAmount }]);
  });

  it('computes the deposit from policy', async () => {
    const { booking } = await hold({ checkIn: '2027-06-20', checkOut: '2027-06-22', paymentMode: 'deposit' });
    expect(booking.amountDueNow).toBe(Math.round(booking.totalAmount / 2));
  });
});

describe('Paystack charge', () => {
  it('confirms on a verified charge, exactly once', async () => {
    const { booking } = await hold({ checkIn: '2027-07-01', checkOut: '2027-07-04' });
    const { intent } = await startPayment(db, booking.id, 'paystack', NOW);
    const charge = { reference: intent.reference, amount: intent.amount, currency: 'GHS', channel: 'mobile_money' };

    expect(await applySuccessfulCharge(db, charge, later(2))).toBe('confirmed');
    expect(await applySuccessfulCharge(db, charge, later(3))).toBe('duplicate');

    const folio = await db.select().from(folioEntries).where(eq(folioEntries.bookingId, booking.id));
    expect(folio.map((f) => f.type).sort()).toEqual(['charge', 'payment']);
    const view = await getBookingForGuest(db, booking.reference);
    expect(view).toMatchObject({ status: 'confirmed', paid: booking.totalAmount, nights: 3 });
  });

  it('refuses to confirm when the amount is wrong', async () => {
    const { booking } = await hold({ checkIn: '2027-07-10', checkOut: '2027-07-11' });
    const { intent } = await startPayment(db, booking.id, 'paystack', NOW);
    expect(await applySuccessfulCharge(db, { reference: intent.reference, amount: 100, currency: 'GHS' }, NOW)).toBe('amount_mismatch');
    const [b] = await db.select().from(bookings).where(eq(bookings.id, booking.id));
    expect(b.status).toBe('pending_payment');
    expect(await db.select().from(alerts).where(eq(alerts.bookingId, booking.id))).toHaveLength(1);
  });

  it('confirms a late payment if the dates are still free', async () => {
    const { booking } = await hold({ checkIn: '2027-08-01', checkOut: '2027-08-02' });
    const { intent } = await startPayment(db, booking.id, 'paystack', NOW);
    await expireHolds(db, later(60));
    expect(await applySuccessfulCharge(db, { reference: intent.reference, amount: intent.amount, currency: 'GHS' }, later(61))).toBe('confirmed');
  });

  it('flags a refund when a late payment lost its dates', async () => {
    const { booking } = await hold({ checkIn: '2027-08-10', checkOut: '2027-08-12' });
    const { intent } = await startPayment(db, booking.id, 'paystack', NOW);
    await expireHolds(db, later(60));
    await hold({ checkIn: '2027-08-11', checkOut: '2027-08-13', paymentMode: 'pay_on_arrival' }, false, later(60));

    expect(await applySuccessfulCharge(db, { reference: intent.reference, amount: intent.amount, currency: 'GHS' }, later(61))).toBe('needs_refund');
    const [b] = await db.select().from(bookings).where(eq(bookings.id, booking.id));
    expect(b.status).toBe('expired');
    const [alert] = await db.select().from(alerts).where(eq(alerts.bookingId, booking.id));
    expect(alert.type).toBe('payment_after_hold_expired');
    // the money is still on the folio so the refund can be traced
    const folio = await db.select().from(folioEntries).where(eq(folioEntries.bookingId, booking.id));
    expect(folio).toMatchObject([{ type: 'payment', amount: intent.amount }]);
  });

  it('ignores unknown references', async () => {
    expect(await applySuccessfulCharge(db, { reference: 'nope', amount: 1, currency: 'GHS' })).toBe('unknown_reference');
  });
});

describe('webhook signature', () => {
  it('accepts only bodies signed with the secret key', () => {
    const body = JSON.stringify({ event: 'charge.success' });
    const sig = crypto.createHmac('sha512', 'sk_test_x').update(body).digest('hex');
    expect(verifySignature(body, sig, 'sk_test_x')).toBe(true);
    expect(verifySignature(body + ' ', sig, 'sk_test_x')).toBe(false);
    expect(verifySignature(body, 'abc', 'sk_test_x')).toBe(false);
    expect(verifySignature(body, null, 'sk_test_x')).toBe(false);
  });
});
