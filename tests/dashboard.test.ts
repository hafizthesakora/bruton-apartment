import { describe, it, expect, beforeAll } from 'vitest';
import { testDb } from './helpers';
import { alerts, apartments } from '@/lib/db/schema';
import { createStaffBooking } from '@/lib/booking/staff';
import { checkIn } from '@/lib/booking/frontdesk';
import { createTicket } from '@/lib/maintenance';
import { dashboard, resolveAlert } from '@/lib/dashboard';
import type { DB } from '@/lib/db';

let db: DB;
const STAFF = { id: 1, name: 'Owner' };
const NOW = new Date('2029-05-10T09:00:00Z');

beforeAll(async () => {
  db = await testDb();
  const apts = await db.select().from(apartments);
  const [a, b] = apts;
  const book = (apartmentId: number, checkInDate: string, checkOut: string) => createStaffBooking(db, {
    apartmentId, checkIn: checkInDate, checkOut, adults: 1, children: 0, source: 'walk_in', guest: { fullName: 'Dash Guest' }, notify: false,
  }, STAFF, new Date('2029-05-01T09:00:00Z'));
  await book(a.id, '2029-05-10', '2029-05-12'); // arriving today
  const stay = await book(b.id, '2029-05-08', '2029-05-11'); // in house
  await checkIn(db, stay.id, { idType: 'Passport', idNumber: 'P1', keyIssued: true }, STAFF, new Date('2029-05-08T12:00:00Z'));
  await createTicket(db, { apartmentId: a.id, title: 'Leak', priority: 'urgent', outOfOrder: false }, STAFF);
  await db.insert(alerts).values({ type: 'balance_owing', message: 'Test alert' });
});

describe('dashboard', () => {
  it('gives the owner every section, with today’s numbers', async () => {
    const d = await dashboard(db, 'owner', NOW) as Record<string, any>;
    expect(d.frontDesk).toMatchObject({ arrivals: 1, inHouse: 1, departures: 0, occupiedTonight: 2 });
    expect(d.maintenance).toMatchObject({ open: 1, urgent: 1 });
    expect(d.payments.bills).toBe(1);
    expect(d.alerts).toHaveLength(1);
    expect(d.housekeeping.clean).toBeGreaterThan(0);
  });

  it('only builds what each role may see', async () => {
    const hk = await dashboard(db, 'housekeeping', NOW);
    expect(Object.keys(hk).sort()).toEqual(['housekeeping', 'maintenance', 'today']);
    const fd = await dashboard(db, 'front_desk', NOW);
    expect(fd).toHaveProperty('frontDesk');
    expect(fd).toHaveProperty('alerts');
    expect(fd).not.toHaveProperty('reports');
  });

  it('resolves alerts', async () => {
    const d = await dashboard(db, 'owner', NOW) as Record<string, any>;
    await resolveAlert(db, d.alerts[0].id, STAFF);
    expect((await dashboard(db, 'owner', NOW) as Record<string, any>).alerts).toHaveLength(0);
  });
});
