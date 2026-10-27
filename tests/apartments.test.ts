import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartmentPhotos, apartments, ratePlans } from '@/lib/db/schema';
import { searchAvailability } from '@/lib/booking/engine';
import { createStaffBooking } from '@/lib/booking/staff';
import {
  addPhoto, addRatePlan, createApartment, getPolicies, listApartments, makeCoverPhoto, moveApartment, removePhoto,
  setRatePlanActive, updateApartment, updatePolicies, updateRatePlan,
} from '@/lib/apartments';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
const STAFF = { id: 1, name: 'Owner' };
// Far enough ahead that "today" never interferes.
const search = (checkIn: string, checkOut: string) => searchAvailability(db, { checkIn, checkOut, guests: 1 }, new Date('2029-01-01T08:00:00Z'));

beforeAll(async () => {
  db = await testDb();
  studio = (await db.select().from(apartments)).find((a) => a.slug === 'studio')!.id;
});

describe('apartments', () => {
  it('creates new apartments hidden, with a unique slug, until they have a standard rate', async () => {
    const a = await createApartment(db, { name: 'Garden Studio', maxGuests: 2, bedrooms: 1, bathrooms: 1, amenities: ['Wi-Fi', ' Wi-Fi ', 'AC'] }, STAFF);
    expect(a).toMatchObject({ slug: 'garden-studio', active: false, amenities: ['Wi-Fi', 'AC'] });
    await expect(updateApartment(db, a.id, { active: true }, STAFF)).rejects.toThrow(/standard/);
    await addRatePlan(db, a.id, { name: 'Standard', baseRate: 40_000 }, STAFF);
    expect((await updateApartment(db, a.id, { active: true }, STAFF)).active).toBe(true);
    const listed = (await listApartments(db)).find((x) => x.id === a.id)!;
    expect(listed).toMatchObject({ missingBaseRate: false, upcomingBookings: 0 });
    expect((await search('2029-02-01', '2029-02-03')).find((r) => r.id === a.id)).toMatchObject({ available: true, quote: { total: 80_000 } });
  });

  it('won’t hide an apartment that has guests coming', async () => {
    await createStaffBooking(db, { apartmentId: studio, checkIn: '2029-03-01', checkOut: '2029-03-02', adults: 1, children: 0, source: 'walk_in', guest: { fullName: 'A' }, notify: false }, STAFF, new Date('2029-01-01T08:00:00Z'));
    await expect(updateApartment(db, studio, { active: false }, STAFF)).rejects.toMatchObject({ status: 409 });
    await expect(updateApartment(db, studio, { maxGuests: 0 }, STAFF)).rejects.toThrow(/guest limit/);
  });

  it('reorders apartments and photos', async () => {
    const before = (await listApartments(db)).map((a) => a.id);
    await moveApartment(db, before[1], -1, STAFF);
    const after = (await listApartments(db)).map((a) => a.id);
    expect(after.slice(0, 2)).toEqual([before[1], before[0]]);

    const p1 = await addPhoto(db, studio, '/uploads/a.jpg', 'Bedroom', STAFF);
    const p2 = await addPhoto(db, studio, '/uploads/b.jpg', 'View', STAFF);
    await makeCoverPhoto(db, p2.id, STAFF);
    const photos = (await listApartments(db)).find((a) => a.id === studio)!.photos;
    expect(photos[0].id).toBe(p2.id);
    await removePhoto(db, p1.id, STAFF);
    expect(await db.select().from(apartmentPhotos).where(eq(apartmentPhotos.id, p1.id))).toHaveLength(0);
  });
});

describe('rate plans', () => {
  it('a seasonal rate overrides the standard rate on its nights, and guests are quoted it', async () => {
    const plain = (await search('2029-12-22', '2029-12-23')).find((r) => r.id === studio)!;
    expect(plain.available).toBe(true);
    const xmas = await addRatePlan(db, studio, { name: 'Christmas', baseRate: 120_000, validFrom: '2029-12-20', validTo: '2029-12-31', minNights: 2 }, STAFF);
    const r = (await search('2029-12-22', '2029-12-24')).find((x) => x.id === studio)!;
    expect(r).toMatchObject({ available: true, quote: { total: 240_000 } });
    expect((await search('2029-12-22', '2029-12-23')).find((x) => x.id === studio)).toMatchObject({ available: false, reason: expect.stringMatching(/Minimum stay is 2/) });

    await updateRatePlan(db, xmas.id, { name: 'Christmas', baseRate: 100_000, validFrom: '2029-12-20', validTo: '2029-12-31' }, STAFF);
    expect((await search('2029-12-22', '2029-12-23')).find((x) => x.id === studio)).toMatchObject({ quote: { total: 100_000 } });
  });

  it('refuses overlapping seasons, a second standard rate, and nonsense values', async () => {
    await expect(addRatePlan(db, studio, { name: 'NYE', baseRate: 1, validFrom: '2029-12-30', validTo: '2030-01-02' }, STAFF)).rejects.toThrow(/overlap/);
    await expect(addRatePlan(db, studio, { name: 'Another', baseRate: 1 }, STAFF)).rejects.toThrow(/already has a standard/);
    await expect(addRatePlan(db, studio, { name: 'x', baseRate: 0 }, STAFF)).rejects.toThrow(/above zero/);
    await expect(addRatePlan(db, studio, { name: 'x', baseRate: 1, validFrom: '2030-02-01' }, STAFF)).rejects.toThrow(/both a start and an end/);
    await expect(addRatePlan(db, studio, { name: 'x', baseRate: 1, validFrom: '2030-02-05', validTo: '2030-02-01' }, STAFF)).rejects.toThrow(/ends before/);
    await expect(addRatePlan(db, studio, { name: 'x', baseRate: 1, validFrom: '2030-02-01', validTo: '2030-02-05', longStayDiscountPct: 10 }, STAFF)).rejects.toThrow(/long-stay/);
  });

  it('keeps the standard rate on an open apartment; seasonal ones can be switched off', async () => {
    const plans = await db.select().from(ratePlans).where(eq(ratePlans.apartmentId, studio));
    const standard = plans.find((p) => !p.validFrom)!;
    const season = plans.find((p) => p.name === 'Christmas')!;
    await expect(setRatePlanActive(db, standard.id, false, STAFF)).rejects.toThrow(/needs its standard rate/);
    await setRatePlanActive(db, season.id, false, STAFF);
    expect((await search('2029-12-22', '2029-12-23')).find((x) => x.id === studio)).toMatchObject({ available: true });
  });
});

describe('policies', () => {
  it('updates and validates booking policies', async () => {
    const p = await updatePolicies(db, { depositPct: 30, checkInTime: '15:00', allowPayOnArrival: true }, STAFF);
    expect(p).toMatchObject({ depositPct: 30, checkInTime: '15:00', allowPayOnArrival: true });
    expect((await getPolicies(db)).checkOutTime).toBe('11:00');
    await expect(updatePolicies(db, { checkOutTime: '25:00' }, STAFF)).rejects.toThrow(/like 11:00/);
    await expect(updatePolicies(db, { depositPct: 0 }, STAFF)).rejects.toThrow(/1–100/);
  });
});
