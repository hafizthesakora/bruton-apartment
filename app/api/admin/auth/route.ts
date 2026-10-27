import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { signToken } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { staffUsers } from '@/lib/db/schema';
import { getStaff } from '@/lib/auth/staff';
import { audit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json().catch(() => ({}));
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const db = await getDb();
    const [user] = await db.select().from(staffUsers).where(eq(staffUsers.username, username.trim().toLowerCase()));
    const ok = user?.active && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await db.update(staffUsers).set({ lastLoginAt: new Date() }).where(eq(staffUsers.id, user.id));
    await audit(user, 'staff', user.id, 'login');

    const token = await signToken({ sub: String(user.id), username: user.username, role: user.role });
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[auth]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Who am I — used by the admin sidebar to show role-appropriate links. */
export async function GET() {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  return NextResponse.json(staff);
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
  return response;
}
