import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { can } from '@/lib/auth/rbac';
import { BookingError } from '@/lib/booking/engine';
import { dashboard, resolveAlert } from '@/lib/dashboard';

export const dynamic = 'force-dynamic';

export const GET = guard('dashboard', 'view', async (_request, staff) => {
  return NextResponse.json(await dashboard(await getDb(), staff.role));
});

/** Mark an alert as dealt with. */
export const POST = guard('dashboard', 'view', async (request, staff) => {
  if (!can(staff.role, 'payments', 'full')) throw new HttpError(403, 'You do not have access to this');
  const { alertId } = z.object({ alertId: z.number().int().positive() }).parse(await request.json());
  try {
    return NextResponse.json(await resolveAlert(await getDb(), alertId, staff));
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
});
