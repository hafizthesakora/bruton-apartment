import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, housekeepingStatus, staffUsers } from '@/lib/db/schema';
import { createStaffBooking, type StaffBookingInput } from '@/lib/booking/staff';
import { checkIn, checkOut } from '@/lib/booking/frontdesk';
import { addTask, deleteTask, housekeepingBoard, setRoomStatus, updateTask } from '@/lib/booking/housekeeping';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
let suite: number;
let cleaner: { id: number; name: string };
const STAFF = { id: 1, name: 'Owner' };
const at = (d: string) => new Date(`${d}T10:00:00Z`);
const ID = { idType: 'Ghana Card', idNumber: 'GHA-1', keyIssued: true };

const create = (o: Partial<StaffBookingInput> = {}) => createStaffBooking(db, {
  apartmentId: studio, checkIn: '2028-01-10', checkOut: '2028-01-12', adults: 1, children: 0, source: 'walk_in',
  guest: { fullName: 'Ato Quaye' }, notify: false, ...o,
}, STAFF, at('2028-01-01'));
const status = async (aptId: number) => (await db.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, aptId)))[0]?.status;

beforeAll(async () => {
  db = await testDb();
  const rows = await db.select().from(apartments);
  studio = rows.find((a) => a.slug === 'studio')!.id;
  suite = rows.find((a) => a.slug === 'executive-suite')!.id;
  const [c] = await db.insert(staffUsers).values({ username: 'cleaner1', name: 'Adwoa Cleaner', role: 'housekeeping', passwordHash: 'x' }).returning();
  cleaner = { id: c.id, name: c.name };
});

describe('checkout → clean → ready', () => {
  it('starting the checkout clean puts the room in progress; finishing it marks it clean', async () => {
    const b = await create();
    await checkIn(db, b.id, ID, STAFF, at('2028-01-10'));
    await checkOut(db, b.id, { keyReturned: true, allowBalance: true }, STAFF, at('2028-01-12'));
    expect(await status(studio)).toBe('dirty');

    const board = await housekeepingBoard(db, '2028-01-12');
    const task = board.tasks.find((t) => t.apartmentId === studio && t.task.includes(b.reference))!;
    expect(board.apartments.find((a) => a.id === studio)).toMatchObject({ status: 'dirty', openTasks: 1 });
    expect(board.cleaners.map((c) => c.name)).toContain('Adwoa Cleaner');

    const started = await updateTask(db, task.id, { action: 'start' }, cleaner, at('2028-01-12'));
    expect(started.task.assignedTo).toBe(cleaner.id); // claimed by whoever started it
    expect(await status(studio)).toBe('in_progress');

    const done = await updateTask(db, task.id, { action: 'done' }, cleaner, at('2028-01-12'));
    expect(done.roomStatus).toBe('clean');
    expect(await status(studio)).toBe('clean');
  });

  it('stays dirty until the last open task for the room is done', async () => {
    await setRoomStatus(db, suite, 'dirty', '', STAFF);
    const a = await addTask(db, { apartmentId: suite, date: '2028-02-01', task: 'Full clean' }, STAFF);
    const b = await addTask(db, { apartmentId: suite, date: '2028-02-01', task: 'Change towels', assignedTo: cleaner.id }, STAFF);
    expect((await updateTask(db, a.id, { action: 'done' }, cleaner)).roomStatus).toBeNull();
    expect(await status(suite)).toBe('dirty');
    expect((await updateTask(db, b.id, { action: 'done' }, cleaner)).roomStatus).toBe('clean');
  });

  it('never lifts out-of-order by finishing a task', async () => {
    await setRoomStatus(db, suite, 'out_of_order', 'Leaking AC', STAFF);
    const t = await addTask(db, { apartmentId: suite, date: '2028-02-02', task: 'Clean after repair' }, STAFF);
    await updateTask(db, t.id, { action: 'start' }, cleaner);
    await updateTask(db, t.id, { action: 'done' }, cleaner);
    expect(await status(suite)).toBe('out_of_order');
    await setRoomStatus(db, suite, 'clean', '', STAFF);
  });
});

describe('room status', () => {
  it('needs a reason for out of order and warns about guests booked in', async () => {
    const b = await create({ apartmentId: suite, checkIn: '2028-03-05', checkOut: '2028-03-07' });
    await expect(setRoomStatus(db, suite, 'out_of_order', ' ', STAFF)).rejects.toThrow(/why/);
    const r = await setRoomStatus(db, suite, 'out_of_order', 'Burst pipe', STAFF, at('2028-03-01'));
    expect(r.warning).toContain(b.reference);
    await setRoomStatus(db, suite, 'clean', '', STAFF);
  });
});

describe('board', () => {
  it('flags an arrival into a room that is not clean, and carries over unfinished tasks', async () => {
    await setRoomStatus(db, studio, 'dirty', 'Spill', STAFF);
    await create({ checkIn: '2028-04-10', checkOut: '2028-04-11' });
    const old = await addTask(db, { apartmentId: studio, date: '2028-04-08', task: 'Deep clean oven' }, STAFF);
    const board = await housekeepingBoard(db, '2028-04-10');
    const apt = board.apartments.find((a) => a.id === studio)!;
    expect(apt.urgent).toBe(true);
    expect(apt.arrival?.guestName).toBe('Ato Quaye');
    expect(board.tasks.find((t) => t.id === old.id)).toMatchObject({ overdue: true });
    expect(board.counts.dirty).toBeGreaterThanOrEqual(1);
  });

  it('deletes open tasks but keeps finished ones', async () => {
    const t = await addTask(db, { apartmentId: studio, date: '2028-05-01', task: 'Restock' }, STAFF);
    await updateTask(db, t.id, { action: 'done' }, cleaner);
    await expect(deleteTask(db, t.id, STAFF)).rejects.toThrow(/stay on the record/);
    await updateTask(db, t.id, { action: 'reopen' }, cleaner);
    await deleteTask(db, t.id, STAFF);
    expect((await housekeepingBoard(db, '2028-05-01')).tasks.find((x) => x.id === t.id)).toBeUndefined();
  });

  it('refuses to assign to an inactive or unknown staff member', async () => {
    const t = await addTask(db, { apartmentId: studio, date: '2028-05-02', task: 'Windows' }, STAFF);
    await expect(updateTask(db, t.id, { action: 'assign', assignedTo: 99_999 }, STAFF)).rejects.toThrow(/not active/);
    expect((await updateTask(db, t.id, { action: 'assign', assignedTo: cleaner.id }, STAFF)).task.assignedTo).toBe(cleaner.id);
  });
});
