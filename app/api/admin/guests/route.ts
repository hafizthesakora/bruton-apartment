import { NextResponse } from 'next/server';
import { and, desc, ilike, isNull, or } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { guard } from '@/lib/auth/staff';
import { guests } from '@/lib/db/schema';
import { duplicateGroups, guestList } from '@/lib/booking/guests';

export const dynamic = 'force-dynamic';

/**
 * Quick guest lookup for booking forms: name, phone or email.
 * `?mode=list` returns the guest records page instead: guests with stay totals, plus likely duplicates.
 */
export const GET = guard('guests', 'view', async (request) => {
  const params = new URL(request.url).searchParams;
  const q = (params.get('q') ?? '').trim();
  if (params.get('mode') === 'list') {
    const db = await getDb();
    const [list, duplicates] = await Promise.all([guestList(db, { q }), q ? [] : duplicateGroups(db)]);
    return NextResponse.json({ guests: list, duplicates });
  }
  if (q.length < 2) return NextResponse.json([]);
  const like = `%${q.replace(/[%_]/g, '')}%`;
  const db = await getDb();
  const rows = await db.select({ id: guests.id, fullName: guests.fullName, phone: guests.phone, email: guests.email })
    .from(guests)
    .where(and(isNull(guests.mergedIntoId), or(ilike(guests.fullName, like), ilike(guests.phone, like), ilike(guests.email, like))))
    .orderBy(desc(guests.id))
    .limit(8);
  return NextResponse.json(rows);
});
