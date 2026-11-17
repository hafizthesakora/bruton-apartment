import { beforeAll, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import type { DB } from '@/lib/db';
import { alerts, apartments, bookings, calendarFeeds } from '@/lib/db/schema';
import { applyCalendar, disconnectFeed, exportCalendar, saveFeed, syncFeed } from '@/lib/channel';
import { calendarText, calendarURL, fetchCalendar, parseCalendar } from '@/lib/channel/ical';
import { createStaffBooking } from '@/lib/booking/staff';

const event = { uid: 'reservation-1', checkIn: '2029-06-01', checkOut: '2029-06-04', cancelled: false };
const text = (properties = 'UID:one\r\nDTSTART;VALUE=DATE:20290601\r\nDTEND;VALUE=DATE:20290604') => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\n${properties}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
const staff = { id: 1, name: 'Owner' };
const now = new Date('2029-01-01T10:00:00Z');

describe('iCalendar validation', () => {
  it('reads all-day events and folded identifiers', () => {
    expect(parseCalendar(text('UID:reser\r\n vation\r\nDTSTART;VALUE=DATE:20290601\r\nDTEND;VALUE=DATE:20290604'))).toEqual([{ ...event, uid: 'reservation' }]);
  });
  it('writes a private dates-only export with an exclusive end date', () => {
    const output = calendarText([{ id: 1, checkIn: event.checkIn, checkOut: event.checkOut }], now);
    expect(parseCalendar(output)).toEqual([{ ...event, uid: 'booking-1@brutongardens.local' }]);
    expect(output).not.toMatch(/guest|email|phone/i);
  });
  it.each(['<html>error</html>', text('UID:one'), text('UID:one\nDTSTART:20290230\nDTEND:20290301'), text('UID:one\nDTSTART:20290604\nDTEND:20290601'), text('UID:one\nDTSTART:20290601\nDTEND:20290602\nRRULE:FREQ=DAILY')])('rejects unsafe or unsupported snapshots', (input) => {
    expect(() => parseCalendar(input)).toThrow();
  });
  it.each(['http://airbnb.com/a', 'https://127.0.0.1/a', 'https://airbnb.com.attacker.test/a', 'https://user:password@airbnb.com/a', 'https://airbnb.com:8443/a', 'https://booking.com/a'])('rejects unexpected calendar URLs: %s', (url) => {
    expect(() => calendarURL(url, 'airbnb')).toThrow();
  });
  it('accepts channel HTTPS export URLs', () => {
    expect(calendarURL('https://www.airbnb.com/calendar/ical/123.ics', 'airbnb')).toContain('airbnb.com');
  });
  it('bounds downloads and disables redirects', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('x'.repeat(1_000_001)));
    await expect(fetchCalendar('https://www.airbnb.com/a', 'airbnb', fetcher)).rejects.toThrow(/too large/);
    expect(fetcher.mock.calls[0][1]?.redirect).toBe('error');
  });
});

describe('channel calendar integration', () => {
  let db: DB, feedId: number, apartmentId: number, token: string;
  beforeAll(async () => {
    db = await testDb();
    apartmentId = (await db.select().from(apartments))[0].id;
    const feed = await saveFeed(db, { apartmentId, source: 'airbnb', url: 'https://www.airbnb.com/calendar/ical/123.ics' }, staff);
    feedId = feed.id; token = feed.exportToken;
  });

  it('imports, deduplicates and updates channel dates', async () => {
    expect(await applyCalendar(db, feedId, [event], now)).toMatchObject({ imported: 1 });
    expect(await applyCalendar(db, feedId, [event], now)).toMatchObject({ imported: 0, updated: 0 });
    expect(await applyCalendar(db, feedId, [{ ...event, checkOut: '2029-06-05' }], now)).toMatchObject({ updated: 1 });
    expect(await db.select().from(bookings)).toHaveLength(1);
  });
  it('never overwrites a direct booking when a channel overlaps it', async () => {
    await createStaffBooking(db, { apartmentId, checkIn: '2029-06-06', checkOut: '2029-06-08', adults: 1, children: 0, source: 'phone', guest: { fullName: 'Private Guest', email: 'private@example.com' }, notify: false }, staff, now);
    const events = [{ ...event, checkOut: '2029-06-05' }, { ...event, uid: 'conflict', checkIn: '2029-06-06', checkOut: '2029-06-09' }];
    expect(await applyCalendar(db, feedId, events, now)).toMatchObject({ conflicts: 1 });
    await applyCalendar(db, feedId, events, now);
    expect(await db.select().from(alerts).where(eq(alerts.type, 'channel_conflict'))).toHaveLength(1);
    const output = await exportCalendar(db, feedId, token);
    expect(parseCalendar(output)).toHaveLength(1); // excludes the importing channel's own event
    expect(output).not.toContain('private@example.com');
    expect(output).not.toContain('Private Guest');
    await expect(exportCalendar(db, feedId, 'wrong')).rejects.toMatchObject({ status: 404 });
  });
  it('retains reservations on a failed download', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network failed'));
    try {
      await expect(syncFeed(db, feedId)).rejects.toMatchObject({ status: 502 });
      expect((await db.select().from(bookings)).filter((b) => b.status === 'confirmed')).toHaveLength(2);
      expect((await db.select().from(calendarFeeds))[0].lastError).toBeTruthy();
    } finally { fetcher.mockRestore(); }
  });
  it('releases cancelled future calendar blocks and preserves direct bookings', async () => {
    expect(await applyCalendar(db, feedId, [], now)).toMatchObject({ cancelled: 1 });
    const rows = await db.select().from(bookings);
    expect(rows.find((b) => b.source === 'airbnb')?.status).toBe('cancelled');
    expect(rows.find((b) => b.source === 'phone')?.status).toBe('confirmed');
  });
  it('revokes the export link when disconnected', async () => {
    await disconnectFeed(db, feedId, staff);
    await expect(exportCalendar(db, feedId, token)).rejects.toMatchObject({ status: 404 });
  });
});
