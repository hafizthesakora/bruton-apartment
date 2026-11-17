import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import type { DB } from '@/lib/db';
import { apartments, bookings, housekeepingStatus, ratePlans, siteContent } from '@/lib/db/schema';
import { listShowcase } from '@/lib/apartments';
import { groupAvailableRooms } from '@/lib/room-types';
import { createHold, searchAvailability } from '@/lib/booking/engine';
import { createStaffBooking } from '@/lib/booking/staff';
import { checkIn, checkOut } from '@/lib/booking/frontdesk';
import { housekeepingBoard } from '@/lib/booking/housekeeping';
import { reconcileInventory } from '@/lib/db/review-inventory';
import { reviewedContent } from '@/lib/site-content';
import { PUBLIC_NAV } from '@/lib/navigation';
import { EXPENSE_CATEGORIES } from '@/lib/expenses';

let db: DB;
const staff = { id: 1, name: 'Owner' };
const now = new Date('2029-01-01T10:00:00Z');
beforeAll(async () => { db = await testDb(); });

describe('final review inventory', () => {
  it('has exactly 5 studios and 6 two-bedroom apartments, with two public cards', async () => {
    const rows = await db.select().from(apartments).where(eq(apartments.active, true));
    expect(rows).toHaveLength(11);
    expect(rows.filter((a) => a.roomType === 'garden_studio')).toHaveLength(5);
    expect(rows.filter((a) => a.roomType === 'two_bedroom')).toHaveLength(6);
    expect(rows.some((a) => a.amenities.includes('Washing machine'))).toBe(false);
    const cards = await listShowcase(db);
    expect(cards.map((a) => [a.name, a.unitCount])).toEqual([['Garden Studio', 5], ['Two-Bedroom Apartment', 6]]);
    expect(cards.every((a) => a.photo && !a.photo.url.includes('main-home'))).toBe(true);
  });

  it('allocates physical rooms separately and updates the room-type count', async () => {
    const query = { checkIn: '2029-02-01', checkOut: '2029-02-03', guests: 2 };
    const before = await searchAvailability(db, query, now);
    const studios = before.filter((a) => a.roomType === 'garden_studio');
    for (const unit of studios) {
      await createHold(db, { apartmentId: unit.id, checkIn: query.checkIn, checkOut: query.checkOut, adults: 2, children: 0, paymentMode: 'pay_on_arrival', guest: { fullName: 'Test Guest', email: `guest${unit.id}@example.com`, phone: '0244000000' } }, { paystackEnabled: false, now });
    }
    const grouped = groupAvailableRooms(await searchAvailability(db, query, now));
    expect(grouped.find((a) => a.roomType === 'garden_studio')).toMatchObject({ available: false, availableUnits: 0, totalUnits: 5 });
    expect(grouped.find((a) => a.roomType === 'two_bedroom')).toMatchObject({ available: true, availableUnits: 6 });
  });

  it('preserves existing booking history and prices when retiring old sample categories', async () => {
    const [legacy] = await db.insert(apartments).values({ slug: 'executive-suite', name: 'Executive Suite' }).returning();
    await db.insert(ratePlans).values({ apartmentId: legacy.id, baseRate: 10000 });
    const booking = await createStaffBooking(db, { apartmentId: legacy.id, checkIn: '2029-03-01', checkOut: '2029-03-02', adults: 1, children: 0, source: 'phone', guest: { fullName: 'Existing Guest' }, notify: false }, staff, now);
    const [studio] = await db.select().from(apartments).where(eq(apartments.slug, 'studio'));
    await db.update(ratePlans).set({ baseRate: 77700 }).where(eq(ratePlans.apartmentId, studio.id));
    await db.delete(siteContent).where(eq(siteContent.key, 'review-room-inventory-v1'));
    await reconcileInventory(db);
    expect((await db.select().from(apartments).where(eq(apartments.id, legacy.id)))[0].active).toBe(false);
    expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].status).toBe('confirmed');
    expect((await db.select().from(ratePlans).where(eq(ratePlans.apartmentId, studio.id)))[0].baseRate).toBe(77700);
    expect((await db.select().from(apartments).where(eq(apartments.active, true))).length).toBe(11);
  });
});

describe('automatic housekeeping occupancy', () => {
  it('tracks same-day arrival, checkout and maintenance restrictions', async () => {
    const [unit] = await db.select().from(apartments).where(eq(apartments.slug, 'two-bedroom'));
    const booking = await createStaffBooking(db, { apartmentId: unit.id, checkIn: '2029-04-01', checkOut: '2029-04-03', adults: 1, children: 0, source: 'phone', guest: { fullName: 'Occupancy Test' }, notify: false }, staff, now);
    expect((await housekeepingBoard(db, '2029-04-01')).apartments.find((a) => a.id === unit.id)?.occupied).toBe(false);
    await checkIn(db, booking.id, { idType: 'Passport', idNumber: 'TEST', keyIssued: true }, staff, new Date('2029-04-01T12:00:00Z'));
    expect((await housekeepingBoard(db, '2029-04-01')).apartments.find((a) => a.id === unit.id)).toMatchObject({ occupied: true, occupant: { reference: booking.reference }, urgent: false });
    await db.update(housekeepingStatus).set({ status: 'out_of_order' }).where(eq(housekeepingStatus.apartmentId, unit.id));
    await checkOut(db, booking.id, { keyReturned: true, allowBalance: true }, staff, new Date('2029-04-03T10:00:00Z'));
    const board = await housekeepingBoard(db, '2029-04-03');
    expect(board.apartments.find((a) => a.id === unit.id)).toMatchObject({ occupied: false, status: 'out_of_order' });
    expect(board.tasks.some((t) => t.apartmentId === unit.id && t.task.includes(booking.reference))).toBe(true);
  });
});

describe('reviewed content', () => {
  it('corrects saved defaults without changing the supplied object', () => {
    const old = { services: { hero: { title: 'Our Services' } }, about: { team: { members: [{ name: 'Mrs. Portia Owusu Asante' }] } }, facilities: { categories: [{ category: 'In-Apartment Features', items: [{ title: 'Washer & Dryer', description: 'In-unit laundry' }] }], explore: { primaryCta: 'Start Tour' } }, footer: { quickLinks: [] } };
    const updated = reviewedContent(old) as typeof old;
    expect(updated.services.hero.title).toBe('Services');
    expect(updated.about.team.members[0].name).toBe('Yaa Asante');
    expect(updated.facilities.categories[0].items.map((i) => i.title)).toEqual(['Laundry Services', 'Iron & Ironing Board', 'Satellite Smart TV']);
    expect(updated.facilities.explore.primaryCta).toBe('View Apartment Photos');
    expect(updated.footer.quickLinks).toEqual(PUBLIC_NAV);
    expect(old.services.hero.title).toBe('Our Services');
    expect(reviewedContent(updated)).toEqual(updated);
    expect(EXPENSE_CATEGORIES).toContain('Electricity');
  });
});
