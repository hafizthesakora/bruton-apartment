import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { and, asc, eq, ne } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { staffUsers } from '@/lib/db/schema';
import { guard, HttpError } from '@/lib/auth/staff';
import { ROLES } from '@/lib/auth/rbac';
import { audit } from '@/lib/audit';

const publicCols = {
  id: staffUsers.id, username: staffUsers.username, name: staffUsers.name, role: staffUsers.role,
  active: staffUsers.active, lastLoginAt: staffUsers.lastLoginAt, createdAt: staffUsers.createdAt,
};

export const GET = guard('users', 'view', async () => {
  const db = await getDb();
  return NextResponse.json(await db.select(publicCols).from(staffUsers).orderBy(asc(staffUsers.name)));
});

const createSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/, '3–32 letters, numbers, . _ -'),
  name: z.string().trim().min(1),
  role: z.enum(ROLES as [string, ...string[]]),
  password: z.string().min(8, 'at least 8 characters'),
});

export const POST = guard('users', 'full', async (request, staff) => {
  const input = createSchema.parse(await request.json());
  const db = await getDb();
  const [exists] = await db.select({ id: staffUsers.id }).from(staffUsers).where(eq(staffUsers.username, input.username));
  if (exists) throw new HttpError(409, 'That username is taken');
  const [user] = await db.insert(staffUsers).values({
    username: input.username, name: input.name, role: input.role as never,
    passwordHash: await bcrypt.hash(input.password, 10),
  }).returning(publicCols);
  await audit(staff, 'staff', user.id, 'create', { username: user.username, role: user.role });
  return NextResponse.json(user, { status: 201 });
});

const updateSchema = z.object({
  id: z.number().int(),
  name: z.string().trim().min(1).optional(),
  role: z.enum(ROLES as [string, ...string[]]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, 'at least 8 characters').optional(),
});

export const PATCH = guard('users', 'full', async (request, staff) => {
  const { id, password, ...changes } = updateSchema.parse(await request.json());
  const db = await getDb();
  const [user] = await db.select().from(staffUsers).where(eq(staffUsers.id, id));
  if (!user) throw new HttpError(404, 'Staff member not found');

  const losesOwner = user.role === 'owner' && ((changes.role && changes.role !== 'owner') || changes.active === false);
  if (losesOwner) {
    const others = await db.select({ id: staffUsers.id }).from(staffUsers)
      .where(and(eq(staffUsers.role, 'owner'), eq(staffUsers.active, true), ne(staffUsers.id, id)));
    if (others.length === 0) throw new HttpError(400, 'There must always be at least one active owner');
  }

  const set: Partial<typeof staffUsers.$inferInsert> = { ...(changes as object) };
  if (password) set.passwordHash = await bcrypt.hash(password, 10);
  const [updated] = await db.update(staffUsers).set(set).where(eq(staffUsers.id, id)).returning(publicCols);
  await audit(staff, 'staff', id, 'update', { ...changes, ...(password ? { password: '(changed)' } : {}) });
  return NextResponse.json(updated);
});
