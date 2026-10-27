import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { addTask, deleteTask, housekeepingBoard, setRoomStatus, updateTask } from '@/lib/booking/housekeeping';
import { todayAtProperty } from '@/lib/booking/pricing';

export const dynamic = 'force-dynamic';

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('housekeeping', 'view', async (request) => {
  const date = new URL(request.url).searchParams.get('date') || todayAtProperty();
  return NextResponse.json(await run(async () => housekeepingBoard(await getDb(), date)));
});

const id = z.number().int().positive();
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status'), apartmentId: id, status: z.enum(['clean', 'dirty', 'in_progress', 'out_of_order']), note: z.string().max(300).default('') }),
  z.object({ action: z.literal('add_task'), apartmentId: id, date: z.string(), task: z.string().trim().min(1, 'Describe the task').max(200), assignedTo: id.nullable().optional() }),
  z.object({ action: z.literal('assign'), id, assignedTo: id.nullable() }),
  z.object({ action: z.enum(['start', 'done', 'reopen']), id }),
  z.object({ action: z.literal('delete_task'), id }),
]);

export const POST = guard('housekeeping', 'full', async (request, staff) => {
  const a = schema.parse(await request.json());
  const db = await getDb();
  return NextResponse.json(await run(async () => {
    switch (a.action) {
      case 'status': return setRoomStatus(db, a.apartmentId, a.status, a.note, staff);
      case 'add_task': return addTask(db, a, staff);
      case 'assign': return updateTask(db, a.id, { action: 'assign', assignedTo: a.assignedTo }, staff);
      case 'delete_task': await deleteTask(db, a.id, staff); return { ok: true };
      default: return updateTask(db, a.id, { action: a.action }, staff);
    }
  }));
});
