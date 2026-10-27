import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, auditLog } from '@/lib/db/schema';
import { addExpense, deleteExpense, listExpenses } from '@/lib/expenses';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
const STAFF = { id: 1, name: 'Owner' };

beforeAll(async () => {
  db = await testDb();
  studio = (await db.select().from(apartments)).find((a) => a.slug === 'studio')!.id;
});

describe('expenses', () => {
  it('adds, lists by range and totals by category', async () => {
    await addExpense(db, { date: '2028-09-01', category: 'Utilities', description: 'ECG prepaid', amount: 50_000 }, STAFF);
    await addExpense(db, { date: '2028-09-15', category: 'Utilities', amount: 20_000 }, STAFF);
    await addExpense(db, { date: '2028-09-20', category: 'Guest amenities', amount: 8_000, apartmentId: studio }, STAFF);
    await addExpense(db, { date: '2028-10-01', category: 'Utilities', amount: 99_000 }, STAFF);

    const r = await listExpenses(db, { from: '2028-09-01', to: '2028-09-30' });
    expect(r.expenses.map((e) => e.date)).toEqual(['2028-09-20', '2028-09-15', '2028-09-01']);
    expect(r.expenses[0]).toMatchObject({ apartmentName: 'Garden Studio', createdBy: expect.any(String) });
    expect(r.byCategory).toEqual([{ category: 'Utilities', amount: 70_000 }, { category: 'Guest amenities', amount: 8_000 }]);
    expect(r.total).toBe(78_000);
    expect((await listExpenses(db, { from: '2028-09-01', to: '2028-09-30', category: 'Utilities' })).total).toBe(70_000);
  });

  it('offers custom categories once used', async () => {
    await addExpense(db, { date: '2028-09-02', category: 'Generator diesel', amount: 30_000 }, STAFF);
    expect((await listExpenses(db, { from: '2028-01-01', to: '2028-12-31' })).categories).toContain('Generator diesel');
  });

  it('validates, and keeps a copy of deleted expenses in the audit log', async () => {
    await expect(addExpense(db, { date: '2028-13-01', category: 'Utilities', amount: 1 }, STAFF)).rejects.toThrow(/date/);
    await expect(addExpense(db, { date: '2028-09-01', category: ' ', amount: 1 }, STAFF)).rejects.toThrow(/category/);
    await expect(addExpense(db, { date: '2028-09-01', category: 'Other', amount: 0 }, STAFF)).rejects.toThrow(/above zero/);
    const e = await addExpense(db, { date: '2028-09-03', category: 'Other', amount: 1_234 }, STAFF);
    await deleteExpense(db, e.id, STAFF);
    const log = await db.select().from(auditLog).where(eq(auditLog.entityId, String(e.id)));
    expect(log.find((l) => l.action === 'delete')?.diff).toMatchObject({ amount: 1_234, category: 'Other' });
  });
});

describe('audit log reader', () => {
  it('filters by entity and record, and pages with `before`', async () => {
    const { readAuditLog } = await import('@/lib/audit');
    const all = await readAuditLog(db, { entity: 'expense', limit: 2 });
    expect(all.entries).toHaveLength(2);
    expect(all.more).toBe(true);
    expect(all.entries[0].id).toBeGreaterThan(all.entries[1].id);
    const next = await readAuditLog(db, { entity: 'expense', limit: 2, before: all.entries[1].id });
    expect(next.entries.every((e) => e.id < all.entries[1].id)).toBe(true);
    const one = await readAuditLog(db, { entity: 'expense', entityId: all.entries[0].entityId! });
    expect(one.entries.every((e) => e.entityId === all.entries[0].entityId)).toBe(true);
  });
});
