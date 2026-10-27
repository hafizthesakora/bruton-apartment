import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { staffUsers } from '@/lib/db/schema';
import { guard } from '@/lib/auth/staff';
import { AUDIT_ENTITY_LABELS, readAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
const day = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/** GET ?entity=&entityId=&actorId=&from=&to=&before= (keyset paging on id) */
export const GET = guard('audit', 'view', async (request) => {
  const q = new URL(request.url).searchParams;
  const db = await getDb();
  const [log, staff] = await Promise.all([
    readAuditLog(db, {
      entity: q.get('entity') || undefined, entityId: q.get('entityId') || undefined, actorId: num(q.get('actorId')),
      from: day(q.get('from')), to: day(q.get('to')), before: num(q.get('before')),
    }),
    db.select({ id: staffUsers.id, name: staffUsers.name }).from(staffUsers).orderBy(asc(staffUsers.name)),
  ]);
  return NextResponse.json({ ...log, staff, entities: AUDIT_ENTITY_LABELS });
});
