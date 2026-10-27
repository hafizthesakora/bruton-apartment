import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { getDb, type Tx, type DB } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';

type Actor = { id: number | null; name: string } | { id: number; name: string; username?: string };

/** Record who changed what. Pass `tx` to log inside the same transaction as the change. */
export async function audit(
  actor: Actor | null,
  entity: string,
  entityId: string | number | null,
  action: string,
  diff?: unknown,
  tx?: Tx | DB,
) {
  const db = tx ?? (await getDb());
  await db.insert(auditLog).values({
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? 'system',
    entity,
    entityId: entityId == null ? null : String(entityId),
    action,
    diff: diff ?? null,
  });
}

/* ── Reading the log (owner's audit screen) ────────────────────────────── */

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  booking: 'Bookings & payments', guest: 'Guests', apartment: 'Apartments & housekeeping', rate_plan: 'Rates', policies: 'Policies',
  hk_task: 'Housekeeping tasks', maintenance: 'Maintenance', expense: 'Expenses', order: 'Room service', menu_item: 'Menu',
  event: 'Events', viewing: 'Viewings', staff: 'Staff accounts', alert: 'Alerts',
};

export async function readAuditLog(db: DB, opts: { entity?: string; entityId?: string; actorId?: number; from?: string; to?: string; before?: number; limit?: number } = {}) {
  const limit = Math.min(opts.limit ?? 100, 200);
  const rows = await db.select().from(auditLog)
    .where(and(
      opts.entity ? eq(auditLog.entity, opts.entity) : undefined,
      opts.entityId ? eq(auditLog.entityId, opts.entityId) : undefined,
      opts.actorId ? eq(auditLog.actorId, opts.actorId) : undefined,
      opts.from ? gte(auditLog.createdAt, new Date(opts.from + 'T00:00:00Z')) : undefined,
      opts.to ? lt(auditLog.createdAt, new Date(Date.parse(opts.to + 'T00:00:00Z') + 86_400_000)) : undefined,
      opts.before ? lt(auditLog.id, opts.before) : undefined,
    ))
    .orderBy(desc(auditLog.id))
    .limit(limit + 1);
  return { entries: rows.slice(0, limit), more: rows.length > limit };
}
