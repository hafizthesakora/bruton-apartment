import { eq, sql } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { folioEntries } from '@/lib/db/schema';

/** Net amount the guest has paid on a booking (payments minus refunds), in pesewas. */
export async function folioPaid(db: DB | Tx, bookingId: number) {
  const [{ paid }] = await db.select({
    paid: sql<number>`coalesce(sum(case when ${folioEntries.type} = 'payment' then ${folioEntries.amount} when ${folioEntries.type} = 'refund' then -${folioEntries.amount} else 0 end), 0)::int`,
  }).from(folioEntries).where(eq(folioEntries.bookingId, bookingId));
  return Number(paid);
}
