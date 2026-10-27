import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { staffUsers } from '@/lib/db/schema';
import { can, type Permission, type Role } from './rbac';

export type Staff = { id: number; username: string; name: string; role: Role };

/** Current staff member, re-checked against the DB so deactivation / role changes apply at once. */
export async function getStaff(): Promise<Staff | null> {
  const token = (await cookies()).get('admin-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  const id = Number(payload?.sub);
  if (!id) return null;
  const db = await getDb();
  const [user] = await db.select().from(staffUsers).where(eq(staffUsers.id, id));
  if (!user || !user.active) return null;
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireStaff(perm: Permission, need: 'view' | 'full' = 'view'): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new HttpError(401, 'Not signed in');
  if (!can(staff.role, perm, need)) throw new HttpError(403, 'You do not have access to this');
  return staff;
}

type Handler<C> = (request: Request, staff: Staff, ctx: C) => Promise<Response>;

/**
 * Wrap an admin route handler: checks permission, passes the staff member through,
 * and turns thrown HttpErrors (and zod errors) into JSON responses.
 */
export function guard<C = unknown>(perm: Permission, need: 'view' | 'full', handler: Handler<C>) {
  return async (request: Request, ctx: C) => {
    try {
      const staff = await requireStaff(perm, need);
      return await handler(request, staff, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err && typeof err === 'object' && 'issues' in err) {
    const issues = (err as { issues: { path: (string | number)[]; message: string }[] }).issues;
    const first = issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join('.') || 'input'}: ${first.message}` : 'Invalid input', issues },
      { status: 400 },
    );
  }
  // request.json() on a malformed body
  if (err instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  console.error('[api]', err);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
