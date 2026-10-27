'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader, Button, Card, Field, Input, Select, Empty, ErrorText, Table, Td, api, useApi, cx, formatGHS, formatDate } from '../_components/ui';
import { useCan } from '../_components/StaffContext';

type Expense = { id: number; date: string; category: string; description: string; amount: number; apartmentName: string | null; createdBy: string | null };
type Data = {
  expenses: Expense[]; byCategory: { category: string; amount: number }[]; total: number; categories: string[];
  apartments: { id: number; name: string }[];
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
function monthRange(offset = 0): [string, string] {
  const t = new Date();
  return [iso(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + offset, 1))), iso(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + offset + 1, 0)))];
}

export default function ExpensesPage() {
  const canEdit = useCan('expenses', 'full');
  const [[from, to], setRange] = useState<[string, string]>(() => monthRange());
  const [category, setCategory] = useState('');
  const { data, loading, error, reload } = useApi<Data>(`/api/admin/expenses?${new URLSearchParams({ from, to, category })}`);
  const [f, setF] = useState({ date: iso(new Date()), category: 'Utilities', description: '', amount: '', apartmentId: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function add() {
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/expenses', { method: 'POST', json: { ...f, apartmentId: f.apartmentId ? Number(f.apartmentId) : null } });
      setF({ ...f, description: '', amount: '' });
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: Expense) {
    setErr('');
    try {
      await api('/api/admin/expenses', { method: 'DELETE', json: { id: e.id } });
      reload();
    } catch (x) {
      setErr((x as Error).message);
    }
  }

  const max = Math.max(1, ...(data?.byCategory.map((c) => c.amount) ?? [1]));

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Expenses" subtitle="What the property spends. Repair costs from Maintenance appear here automatically." />

      {canEdit && (
        <Card title="Record an expense">
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end text-sm">
            <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Category">
              <Input list="expense-categories" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
              <datalist id="expense-categories">{data?.categories.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <div className="lg:col-span-2"><Field label="Description" hint="optional"><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
            <Field label="Amount (GH₵)"><Input type="number" min="0" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Apartment" hint="optional">
              <Select value={f.apartmentId} options={[{ value: '', label: 'Whole property' }, ...(data?.apartments.map((a) => ({ value: a.id, label: a.name })) ?? [])]} onChange={(e) => setF({ ...f, apartmentId: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button loading={busy} disabled={!f.amount || !f.category.trim()} onClick={add}><Plus size={14} /> Add expense</Button>
            <ErrorText>{err}</ErrorText>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
          {([['This month', 0], ['Last month', -1]] as const).map(([label, off]) => {
            const r = monthRange(off);
            return <button key={label} onClick={() => setRange(r)} className={cx('px-3 py-1.5 rounded-md', from === r[0] && to === r[1] ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>{label}</button>;
          })}
        </div>
        <Input type="date" className="w-40" value={from} onChange={(e) => setRange([e.target.value, to])} />
        <span className="text-gray-400">→</span>
        <Input type="date" className="w-40" value={to} min={from} onChange={(e) => setRange([from, e.target.value])} />
        <Select className="w-48" value={category} options={[{ value: '', label: 'All categories' }, ...(data?.categories.map((c) => ({ value: c, label: c })) ?? [])]} onChange={(e) => setCategory(e.target.value)} />
      </div>

      {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : data && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card title={`Total · ${formatGHS(data.total)}`}>
            {data.byCategory.length === 0 ? <p className="text-sm text-gray-400">Nothing recorded.</p> : (
              <div className="space-y-2.5 text-sm">
                {data.byCategory.map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between"><span className="text-gray-700">{c.category}</span><span className="font-medium">{formatGHS(c.amount)}</span></div>
                    <div className="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden"><div className="h-full rounded-full bg-[#65a30d]" style={{ width: `${(c.amount / max) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <div className="lg:col-span-2">
            <Card padded={false}>
              {data.expenses.length === 0 ? <Empty>No expenses in this period.</Empty> : (
                <Table head={['Date', 'Category', 'Description', 'Apartment', 'Amount', '']}>
                  {data.expenses.map((e) => (
                    <tr key={e.id}>
                      <Td className="whitespace-nowrap">{formatDate(e.date)}</Td>
                      <Td>{e.category}</Td>
                      <Td className="text-gray-600">{e.description || '—'}{e.createdBy && <p className="text-xs text-gray-400">by {e.createdBy}</p>}</Td>
                      <Td className="text-gray-600">{e.apartmentName ?? '—'}</Td>
                      <Td className="whitespace-nowrap font-medium">{formatGHS(e.amount)}</Td>
                      <Td>{canEdit && <button onClick={() => remove(e)} className="text-gray-400 hover:text-red-600" aria-label="Delete expense"><Trash2 size={14} /></button>}</Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
