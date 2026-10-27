import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, bookings, guests } from '@/lib/db/schema';
import type { DB } from '@/lib/db';

let db: DB;
let aptId: number;
let guestId: number;
let n = 0;

const book = (checkIn: string, checkOut: string, status: typeof bookings.$inferInsert.status = 'confirmed', apartmentId = aptId) =>
  db.insert(bookings).values({
    reference: `T${++n}`, apartmentId, guestId, checkIn, checkOut, status, totalAmount: 1000, amountDueNow: 1000,
  }).returning();

beforeAll(async () => {
  db = await testDb();
  [{ id: aptId }] = await db.select({ id: apartments.id }).from(apartments).limit(1);
  [{ id: guestId }] = await db.insert(guests).values({ fullName: 'Test Guest' }).returning();
});

describe('double-booking guard', () => {
  it('rejects overlapping active bookings on the same apartment', async () => {
    await book('2027-01-10', '2027-01-15');
    await expect(book('2027-01-14', '2027-01-16', 'held')).rejects.toThrow();
  });

  it('allows back-to-back stays (checkout day = next check-in day)', async () => {
    await expect(book('2027-01-15', '2027-01-17')).resolves.toHaveLength(1);
  });

  it('ignores cancelled and expired bookings', async () => {
    const [b] = await book('2027-02-01', '2027-02-05');
    await db.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, b.id));
    await expect(book('2027-02-02', '2027-02-04')).resolves.toHaveLength(1);
  });

  it('allows the same dates on a different apartment', async () => {
    const [other] = await db.select({ id: apartments.id }).from(apartments).where(eq(apartments.slug, 'two-bedroom'));
    await expect(book('2027-01-10', '2027-01-15', 'confirmed', other.id)).resolves.toHaveLength(1);
  });

  it('rejects check-out on or before check-in', async () => {
    await expect(book('2027-03-05', '2027-03-05')).rejects.toThrow();
  });
});

describe('seed', () => {
  it('is idempotent', async () => {
    const { seed } = await import('@/lib/db/seed');
    const before = await db.select().from(apartments);
    await seed(db);
    expect(await db.select().from(apartments)).toHaveLength(before.length);
  });
});
