import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { notifications, siteContent, viewings } from '@/lib/db/schema';
import { createViewing, listSlots, updateViewing, listViewings, type ViewingInput } from '@/lib/viewings';
import type { DB } from '@/lib/db';

let db: DB;
const NOW = new Date('2027-03-01T10:30:00Z');
const STAFF = { id: 1, name: 'Front Desk' };

const book = (o: Partial<ViewingInput> = {}, now = NOW) => createViewing(db, {
  name: 'Esi Owusu', email: 'Esi@Example.com', phone: '0551234567', type: 'physical', date: '2027-03-05', time: '10:00', ...o,
}, now);

const msgs = (viewingId: number) => db.select().from(notifications).where(eq(notifications.viewingId, viewingId));

beforeAll(async () => {
  db = await testDb();
  await db.insert(siteContent).values({ key: 'settings.json', data: { recipientEmail: 'frontdesk@example.com', guestMessages: { phone: '+233 24 000 0000' } } });
});

describe('slots', () => {
  it('hides past times today, with an hour’s notice', async () => {
    const slots = await listSlots(db, '2027-03-01', NOW);
    expect(slots.filter((s) => s.available).map((s) => s.time)).toEqual(['12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);
  });

  it('marks a booked slot as taken', async () => {
    await book({ date: '2027-03-02', time: '09:00' });
    const slots = await listSlots(db, '2027-03-02', NOW);
    expect(slots.find((s) => s.time === '09:00')?.available).toBe(false);
    expect(slots.find((s) => s.time === '10:00')?.available).toBe(true);
  });

  it('closes days beyond the booking window', async () => {
    const slots = await listSlots(db, '2027-06-01', NOW);
    expect(slots.some((s) => s.available)).toBe(false);
  });
});

describe('createViewing', () => {
  it('saves the request and queues guest email + SMS and a staff alert', async () => {
    const v = await book();
    expect(v).toMatchObject({ status: 'requested', email: 'esi@example.com' });
    expect(v.scheduledAt.toISOString()).toBe('2027-03-05T10:00:00.000Z');
    const rows = await msgs(v.id);
    expect(rows.map((r) => `${r.template}:${r.channel}:${r.to}`).sort()).toEqual([
      'staff_new_viewing:email:frontdesk@example.com',
      'viewing_booked:email:esi@example.com',
      'viewing_booked:sms:233551234567',
    ]);
    const sms = rows.find((r) => r.channel === 'sms')!.body;
    expect(sms).toContain('Fri 5 Mar, 10:00');
    expect(sms).toMatch(/^[\x20-\x7E]*$/);
  });

  it('refuses a slot that is already taken', async () => {
    await book({ date: '2027-03-06', time: '11:00' });
    await expect(book({ date: '2027-03-06', time: '11:00', email: 'other@example.com' })).rejects.toMatchObject({ status: 409 });
  });

  it('rejects past or off-grid times', async () => {
    await expect(book({ date: '2027-03-01', time: '10:00' })).rejects.toMatchObject({ status: 400 });
    await expect(book({ date: '2027-03-05', time: '10:30' })).rejects.toMatchObject({ status: 400 });
    await expect(book({ date: '2027-03-05', time: '20:00' })).rejects.toMatchObject({ status: 400 });
  });
});

describe('updateViewing', () => {
  it('reschedules and tells the guest; the old slot opens up', async () => {
    const v = await book({ date: '2027-03-08', time: '09:00' });
    const { change } = await updateViewing(db, v.id, { date: '2027-03-09', time: '15:00' }, STAFF, NOW);
    expect(change).toBe('rescheduled');
    expect((await msgs(v.id)).filter((r) => r.template === 'viewing_rescheduled')).toHaveLength(2);
    expect((await listSlots(db, '2027-03-08', NOW)).find((s) => s.time === '09:00')?.available).toBe(true);
  });

  it('won’t move a viewing onto a taken slot', async () => {
    const a = await book({ date: '2027-03-10', time: '09:00' });
    await book({ date: '2027-03-10', time: '10:00', email: 'b@example.com' });
    await expect(updateViewing(db, a.id, { time: '10:00' }, STAFF, NOW)).rejects.toMatchObject({ status: 409 });
  });

  it('cancelling messages the guest and frees the slot; confirming does not message', async () => {
    const v = await book({ date: '2027-03-11', time: '14:00' });
    expect((await updateViewing(db, v.id, { status: 'confirmed' }, STAFF, NOW)).change).toBeNull();
    expect((await updateViewing(db, v.id, { status: 'cancelled' }, STAFF, NOW)).change).toBe('cancelled');
    expect((await msgs(v.id)).filter((r) => r.template === 'viewing_cancelled')).toHaveLength(2);
    await expect(book({ date: '2027-03-11', time: '14:00', email: 'c@example.com' })).resolves.toBeTruthy();
  });

  it('records outcomes without messaging, and only moves live viewings', async () => {
    const v = await book({ date: '2027-03-12', time: '09:00' });
    const later = new Date('2027-03-12T11:00:00Z');
    expect((await updateViewing(db, v.id, { status: 'no_show', staffNotes: 'called, no answer' }, STAFF, later)).change).toBeNull();
    const [row] = await db.select().from(viewings).where(eq(viewings.id, v.id));
    expect(row).toMatchObject({ status: 'no_show', staffNotes: 'called, no answer' });
    await expect(updateViewing(db, v.id, { date: '2027-03-20', time: '09:00' }, STAFF, later)).rejects.toMatchObject({ status: 400 });
  });

  it('lists today’s and future viewings as upcoming', async () => {
    const upcoming = await listViewings(db, 'upcoming', new Date('2027-03-12T18:00:00Z'));
    expect(upcoming[0].scheduledAt.toISOString()).toBe('2027-03-12T09:00:00.000Z');
  });
});
