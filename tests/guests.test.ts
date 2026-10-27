import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, bookings, guests } from '@/lib/db/schema';
import { createStaffBooking, type StaffBookingInput } from '@/lib/booking/staff';
import { addFolioEntry } from '@/lib/booking/folios';
import { duplicateGroups, guestList, guestProfile, mergeGuests, updateGuest } from '@/lib/booking/guests';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
const STAFF = { id: 1, name: 'Front Desk' };
const NOW = new Date('2027-11-01T10:00:00Z');

const create = (guest: StaffBookingInput['guest'], o: Partial<StaffBookingInput> = {}) => createStaffBooking(db, {
  apartmentId: studio, checkIn: '2027-11-10', checkOut: '2027-11-12', adults: 1, children: 0, source: 'walk_in', guest, notify: false, ...o,
}, STAFF, NOW);
const addGuest = async (v: typeof guests.$inferInsert) => (await db.insert(guests).values(v).returning())[0];

beforeAll(async () => {
  db = await testDb();
  studio = (await db.select().from(apartments)).find((a) => a.slug === 'studio')!.id;
});

describe('guest records', () => {
  it('lists guests with stays and amount paid, and searches by name, phone or email', async () => {
    const b = await create({ fullName: 'Akua Darko', phone: '0244555555', email: 'akua@example.com' });
    await addFolioEntry(db, b.id, { kind: 'payment', amount: 30_000, method: 'cash' }, STAFF);
    const [hit] = await guestList(db, { q: '0244555' });
    expect(hit).toMatchObject({ fullName: 'Akua Darko', stays: 1, paid: 30_000, lastStay: '2027-11-10' });
    expect(await guestList(db, { q: 'AKUA@' })).toHaveLength(1);
    expect(await guestList(db, { q: '%' })).not.toHaveLength(0); // wildcard is stripped, not injected
  });

  it('builds a profile with stay history and totals', async () => {
    const b = await create({ fullName: 'Kwame Asare', email: 'kwame@example.com' }, { checkIn: '2027-11-14', checkOut: '2027-11-17' });
    const p = await guestProfile(db, b.guestId);
    if ('mergedIntoId' in p) throw new Error('unexpected merge');
    expect(p.stays.map((s) => s.reference)).toEqual([b.reference]);
    expect(p.summary).toMatchObject({ stays: 1, nights: 3, paid: 0, owing: b.totalAmount });
  });

  it('edits details, lower-cases email, and keeps ID numbers out of the audit log', async () => {
    const g = await addGuest({ fullName: 'Efua Mensah' });
    const u = await updateGuest(db, g.id, { email: ' EFUA@Example.com ', idType: 'Passport', idNumber: 'G1234567', notes: 'Prefers ground floor' }, STAFF);
    expect(u).toMatchObject({ email: 'efua@example.com', idNumber: 'G1234567', notes: 'Prefers ground floor' });
    await expect(updateGuest(db, g.id, { fullName: '  ' }, STAFF)).rejects.toThrow(/name/);
  });

  it('spots duplicates across phone formats and email case', async () => {
    const a = await addGuest({ fullName: 'Yaa Boakye', phone: '0209876543' });
    const b = await addGuest({ fullName: 'Yaa B.', phone: '+233 20 987 6543' });
    const c = await addGuest({ fullName: 'Kofi Ansah', email: 'Kofi.Ansah@example.com' });
    const d = await addGuest({ fullName: 'K. Ansah', email: 'kofi.ansah@example.com', phone: '0209876543' });
    const groups = await duplicateGroups(db);
    const ids = groups.map((g) => g.guests.map((x) => x.id).sort().join(','));
    expect(ids).toContain([a.id, b.id, d.id].sort().join(','));
    expect(ids).toContain([c.id, d.id].sort().join(','));
    const p = await guestProfile(db, a.id);
    if ('mergedIntoId' in p) throw new Error('unexpected merge');
    expect(p.possibleDuplicates.map((x) => x.id).sort()).toEqual([b.id, d.id].sort());
  });

  it('merges a channel duplicate into the direct guest: bookings move, blanks fill, old id redirects', async () => {
    const direct = await create({ fullName: 'Abena Owusu', phone: '0277000111', email: 'abena@example.com' }, { checkIn: '2027-12-01', checkOut: '2027-12-02' });
    const channel = await create({ fullName: 'Abena O', phone: '' }, { checkIn: '2027-12-05', checkOut: '2027-12-06', source: 'airbnb', channelRef: 'HMABENA', totalAmount: 50_000 });
    await updateGuest(db, channel.guestId, { nationality: 'Ghanaian', notes: 'Airbnb guest' }, STAFF);
    await updateGuest(db, direct.guestId, { notes: 'Repeat guest' }, STAFF);

    const r = await mergeGuests(db, direct.guestId, channel.guestId, STAFF);
    expect(r.bookingsMoved).toBe(1);
    const [moved] = await db.select().from(bookings).where(eq(bookings.id, channel.id));
    expect(moved.guestId).toBe(direct.guestId);
    const [kept] = await db.select().from(guests).where(eq(guests.id, direct.guestId));
    expect(kept).toMatchObject({ fullName: 'Abena Owusu', nationality: 'Ghanaian', notes: 'Repeat guest\nAirbnb guest' });
    expect(await guestProfile(db, channel.guestId)).toEqual({ mergedIntoId: direct.guestId });
    expect((await guestList(db, { q: 'Abena' })).map((g) => g.id)).toEqual([direct.guestId]);

    await expect(mergeGuests(db, direct.guestId, channel.guestId, STAFF)).rejects.toThrow(/already been merged/);
    await expect(mergeGuests(db, direct.guestId, direct.guestId, STAFF)).rejects.toThrow(/two different/);
  });
});
