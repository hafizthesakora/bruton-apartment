/**
 * Expenses — what the property spends, by category and (optionally) apartment.
 * Feeds the reports' "cash in less expenses". Maintenance repair costs land here too.
 */
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { apartments, expenses, staffUsers } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from '@/lib/booking/engine';
import { isISODate } from '@/lib/booking/pricing';
import { REPAIRS_CATEGORY } from '@/lib/maintenance';

type Actor = { id: number; name: string };

/** Suggested categories; staff can type their own. */
export const EXPENSE_CATEGORIES = [
  'Utilities', 'Cleaning supplies', 'Laundry', 'Staff wages', REPAIRS_CATEGORY, 'Kitchen & food', 'Guest amenities',
  'Internet & TV', 'Security', 'Fuel & transport', 'Marketing', 'Commission & fees', 'Taxes & levies', 'Other',
];

export async function listExpenses(db: DB, opts: { from: string; to: string; category?: string }) {
  if (!isISODate(opts.from) || !isISODate(opts.to)) throw new BookingError(400, 'Choose a valid date range');
  const where = and(
    gte(expenses.date, opts.from), lte(expenses.date, opts.to),
    opts.category ? eq(expenses.category, opts.category) : undefined,
  );
  const [rows, byCategory, used] = await Promise.all([
    db.select({
      id: expenses.id, date: expenses.date, category: expenses.category, description: expenses.description, amount: expenses.amount,
      apartmentId: expenses.apartmentId, apartmentName: apartments.name, createdBy: staffUsers.name, createdAt: expenses.createdAt,
    }).from(expenses)
      .leftJoin(apartments, eq(apartments.id, expenses.apartmentId))
      .leftJoin(staffUsers, eq(staffUsers.id, expenses.createdBy))
      .where(where).orderBy(desc(expenses.date), desc(expenses.id)).limit(500),
    db.select({ category: expenses.category, amount: sql<number>`sum(${expenses.amount})::int` })
      .from(expenses).where(where).groupBy(expenses.category).orderBy(desc(sql`sum(${expenses.amount})`)),
    db.selectDistinct({ category: expenses.category }).from(expenses),
  ]);
  const categories = [...new Set([...EXPENSE_CATEGORIES, ...used.map((u) => u.category)])];
  return {
    expenses: rows,
    byCategory: byCategory.map((c) => ({ ...c, amount: Number(c.amount) })),
    total: byCategory.reduce((n, c) => n + Number(c.amount), 0),
    categories,
  };
}

export type ExpenseInput = { date: string; category: string; description?: string; amount: number; apartmentId?: number | null };

export async function addExpense(db: DB, input: ExpenseInput, actor: Actor) {
  if (!isISODate(input.date)) throw new BookingError(400, 'Choose a valid date');
  if (!input.category.trim()) throw new BookingError(400, 'Choose a category');
  if (!(input.amount > 0)) throw new BookingError(400, 'Enter an amount above zero');
  const [e] = await db.insert(expenses).values({
    date: input.date, category: input.category.trim(), description: input.description?.trim() ?? '',
    amount: input.amount, apartmentId: input.apartmentId ?? null, createdBy: actor.id,
  }).returning();
  await audit(actor, 'expense', e.id, 'create', { date: e.date, category: e.category, amount: e.amount }, db);
  return e;
}

/** Deleting keeps a full copy in the audit log, so a removed expense can still be traced. */
export async function deleteExpense(db: DB, id: number, actor: Actor) {
  const [e] = await db.select().from(expenses).where(eq(expenses.id, id));
  if (!e) throw new BookingError(404, 'Expense not found');
  await db.delete(expenses).where(eq(expenses.id, id));
  await audit(actor, 'expense', id, 'delete', e, db);
}
