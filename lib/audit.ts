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
