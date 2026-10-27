import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, guestLoginCodes, guests, notifications } from '@/lib/db/schema';
import { createStaffBooking } from '@/lib/booking/staff';
import { addFolioEntry } from '@/lib/booking/folios';
import { accountView, answerChangeRequest, contactKey, guestReceipt, openChangeRequests, requestCode, submitChangeRequest, verifyCode } from '@/lib/account';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
let suite: number;
const STAFF = { id: 1, name: 'Front Desk' };
const NOW = new Date('2029-07-01T09:00:00Z');
const later = (min: number) => new Date(NOW.getTime() + min * 60_000);

const book = (apartmentId: number, checkIn: string, checkOut: string, guest: { fullName: string; phone?: string; email?: string }) =>
  createStaffBooking(db, { apartmentId, checkIn, checkOut, adults: 2, children: 0, source: 'walk_in', guest, notify: false }, STAFF, NOW);

beforeAll(async () => {
  db = await testDb();
  const rows = await db.select().from(apartments);
  studio = rows.find((a) => a.slug === 'studio')!.id;
  suite = rows.find((a) => a.slug === 'executive-suite')!.id;
});

describe('contact keys', () => {
  it('normalises phones and emails, rejects junk', () => {
    expect(contactKey('0244 123 456')).toBe('p:244123456');
    expect(contactKey('+233244123456')).toBe('p:244123456');
    expect(contactKey(' Ama@Example.COM ')).toBe('e:ama@example.com');
    expect(contactKey('12345')).toBeNull();
    expect(contactKey('not-an-email@')).toBeNull();
  });
});

describe('sign-in codes', () => {
  it('only issues codes for contacts we know, and keeps just a hash', async () => {
    await book(studio, '2029-07-10', '2029-07-12', { fullName: 'Ama Serwaa', phone: '0244123456', email: 'ama@example.com' });
    expect(await requestCode(db, '0200000000', NOW)).toBeNull();
    const r = (await requestCode(db, '+233 24 412 3456', NOW))!;
    expect(r).toMatchObject({ key: 'p:244123456', channel: 'sms' });
    expect(r.code).toMatch(/^\d{6}$/);
    const [row] = await db.select().from(guestLoginCodes).where(eq(guestLoginCodes.contactKey, r.key));
    expect(row.codeHash).not.toContain(r.code);
  });

  it('verifies once, within 10 minutes, and locks after 5 wrong tries', async () => {
    const r = (await requestCode(db, 'ama@example.com', NOW))!;
    const wrong = r.code === '000000' ? '111111' : '000000';
    await expect(verifyCode(db, 'ama@example.com', wrong, later(1))).rejects.toThrow(/isn’t right/);
    expect(await verifyCode(db, 'AMA@example.com', r.code, later(2))).toBe('e:ama@example.com');
    await expect(verifyCode(db, 'ama@example.com', r.code, later(2))).rejects.toThrow(/expired/); // used

    const late = (await requestCode(db, 'ama@example.com', NOW))!;
    await expect(verifyCode(db, 'ama@example.com', late.code, later(11))).rejects.toThrow(/expired/);

    const locked = (await requestCode(db, '0244123456', later(20)))!;
    const bad = locked.code === '999999' ? '888888' : '999999';
    for (let i = 0; i < 5; i++) await expect(verifyCode(db, '0244123456', bad, later(21))).rejects.toThrow();
    await expect(verifyCode(db, '0244123456', locked.code, later(21))).rejects.toThrow(/expired/);
  });

  it('limits how many codes can be asked for', async () => {
    await book(suite, '2029-08-01', '2029-08-02', { fullName: 'Rate Limit', email: 'rl@example.com' });
    for (let i = 0; i < 3; i++) await requestCode(db, 'rl@example.com', later(i));
    await expect(requestCode(db, 'rl@example.com', later(4))).rejects.toMatchObject({ status: 429 });
    expect(await requestCode(db, 'rl@example.com', later(30))).not.toBeNull();
  });
});

describe('account', () => {
  it('shows every booking made with the contact, with bill, receipts and nothing of other guests', async () => {
    // A second, unmerged guest record with the same phone in another format.
    const other = await book(suite, '2029-09-01', '2029-09-03', { fullName: 'Ama S.', phone: '+233 244 123 456' });
    await addFolioEntry(db, other.id, { kind: 'payment', amount: 50_000, method: 'momo', reference: 'MM1' }, STAFF);
    await book(studio, '2029-09-05', '2029-09-06', { fullName: 'Someone Else', phone: '0277000000' });

    const v = await accountView(db, 'p:244123456');
    expect(v.bookings.map((b) => b.checkIn)).toEqual(['2029-09-01', '2029-07-10']);
    const b = v.bookings[0];
    expect(b).toMatchObject({ paid: 50_000, balance: b.charges - 50_000, canRequest: true, nights: 2 });
    expect(b.receipts).toHaveLength(1);

    const receipt = await guestReceipt(db, 'p:244123456', b.receipts[0].id);
    expect(receipt).toMatchObject({ amount: 50_000, bookingRef: other.reference });
    await expect(guestReceipt(db, 'p:277000000', b.receipts[0].id)).rejects.toMatchObject({ status: 404 });
  });

  it('change requests reach the front desk, and the reply reaches the guest', async () => {
    const v = await accountView(db, 'e:ama@example.com');
    const bookingId = v.bookings[0].id;
    await expect(submitChangeRequest(db, 'p:277000000', bookingId, 'Not my booking')).rejects.toMatchObject({ status: 404 });
    await expect(submitChangeRequest(db, 'e:ama@example.com', bookingId, 'hi')).rejects.toThrow(/what you’d like/);
    const r = await submitChangeRequest(db, 'e:ama@example.com', bookingId, 'Could we arrive a day later please?');

    const open = await openChangeRequests(db);
    expect(open.find((o) => o.id === r.id)).toMatchObject({ guestName: 'Ama Serwaa', message: 'Could we arrive a day later please?' });

    await answerChangeRequest(db, r.id, 'Done — moved to the 11th.', STAFF);
    await expect(answerChangeRequest(db, r.id, 'again', STAFF)).rejects.toThrow(/already/);
    const after = await accountView(db, 'e:ama@example.com');
    expect(after.bookings[0].requests[0]).toMatchObject({ status: 'resolved', response: 'Done — moved to the 11th.' });
    const sent = await db.select().from(notifications).where(eq(notifications.bookingId, bookingId));
    expect(sent.map((n) => n.template)).toContain('change_request_reply');
  });

  it('a merged-away guest record can’t be used to sign in', async () => {
    const keep = await book(studio, '2029-10-01', '2029-10-02', { fullName: 'Kept', email: 'kept@example.com' });
    await db.insert(guests).values({ fullName: 'Merged away', email: 'gone@example.com', mergedIntoId: keep.guestId });
    expect(await requestCode(db, 'gone@example.com', NOW)).toBeNull();
    expect((await accountView(db, 'e:gone@example.com')).bookings).toHaveLength(0);
  });
});
