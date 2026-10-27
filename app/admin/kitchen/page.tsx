'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, ChefHat, Check, X, Pencil } from 'lucide-react';
import {
  PageHeader, Button, Card, Field, Input, Select, Textarea, Badge, Modal, Empty, ErrorText, Table, Td,
  api, useApi, cx, formatGHS, formatDate,
} from '../_components/ui';
import { useCan } from '../_components/StaffContext';

type Dish = { id: number; name: string; description: string; category: string; price: number; available: boolean };
type Order = {
  id: number; status: 'received' | 'preparing' | 'delivered' | 'cancelled'; total: number; notes: string; placedBy: string;
  createdAt: string; apartmentName: string; guestName: string; reference: string; bookingId: number;
  items: { name: string; qty: number; unitPrice: number }[];
};
type Stay = { bookingId: number; reference: string; apartmentName: string; guestName: string };
type Data = { orders: Order[]; stays: Stay[]; menu: Dish[] };

const COLUMNS = [
  { status: 'received', title: 'New', next: 'preparing', action: 'Start preparing' },
  { status: 'preparing', title: 'Preparing', next: 'delivered', action: 'Delivered' },
] as const;
const minsAgo = (ts: string) => Math.max(0, Math.round((Date.now() - Date.parse(ts)) / 60_000));

export default function KitchenPage() {
  const canEdit = useCan('kitchen', 'full');
  const { data, loading, error, reload } = useApi<Data>('/api/admin/kitchen');
  const [tab, setTab] = useState<'orders' | 'menu'>('orders');
  const [ordering, setOrdering] = useState(false);
  const [err, setErr] = useState('');

  // The kitchen screen stays open all day: refresh for new guest orders.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') reload(); }, 20_000);
    return () => clearInterval(t);
  }, [reload]);

  async function status(o: Order, s: string, reason?: string) {
    setErr('');
    try {
      await api('/api/admin/kitchen', { method: 'POST', json: { action: 'status', id: o.id, status: s, reason } });
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const done = data?.orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled') ?? [];

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <PageHeader
        title="Kitchen & Menu"
        subtitle="Room-service orders from guests and staff. Every order is charged to the guest’s bill."
        actions={canEdit && tab === 'orders' && <Button onClick={() => setOrdering(true)} disabled={!data?.stays.length}><Plus size={14} /> Order for a guest</Button>}
      />
      <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm w-fit">
        {([['orders', 'Orders'], ['menu', 'Menu']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cx('px-3 py-1.5 rounded-md', tab === k ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>{label}</button>
        ))}
      </div>
      <ErrorText>{err}</ErrorText>

      {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : data && (tab === 'menu'
        ? <MenuEditor menu={data.menu} canEdit={canEdit} onChanged={reload} />
        : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {COLUMNS.map((col) => {
                const list = data.orders.filter((o) => o.status === col.status).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
                return (
                  <div key={col.status} className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">{col.title} <Badge color={col.status === 'received' ? 'red' : 'amber'}>{list.length}</Badge></h3>
                    {list.length === 0 && <p className="text-sm text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">Nothing here</p>}
                    {list.map((o) => (
                      <div key={o.id} className={cx('bg-white rounded-xl border-2 p-4 space-y-2', col.status === 'received' ? 'border-red-200' : 'border-amber-200')}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{o.apartmentName} <span className="font-normal text-gray-500">· #{o.id}</span></p>
                            <p className="text-xs text-gray-500">{o.guestName} · {minsAgo(o.createdAt)} min ago{o.placedBy === 'staff' ? ' · by staff' : ''}</p>
                          </div>
                          <span className="font-semibold">{formatGHS(o.total)}</span>
                        </div>
                        <ul className="text-sm">
                          {o.items.map((i, k) => <li key={k}><b>{i.qty}×</b> {i.name}</li>)}
                        </ul>
                        {o.notes && <p className="text-sm bg-amber-50 text-amber-900 rounded-md px-2 py-1">“{o.notes}”</p>}
                        {canEdit && (
                          <div className="flex gap-2 pt-1">
                            <Button className="text-xs" onClick={() => status(o, col.next)}>{col.next === 'preparing' ? <ChefHat size={13} /> : <Check size={13} />} {col.action}</Button>
                            <Button variant="ghost" className="text-xs" onClick={() => status(o, 'cancelled', 'Cancelled by kitchen')}><X size={13} /> Cancel</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <Card title="Last 24 hours" padded={false}>
              {done.length === 0 ? <Empty>No completed orders yet.</Empty> : (
                <Table head={['Order', 'Apartment', 'Items', 'Total', 'Status']}>
                  {done.map((o) => (
                    <tr key={o.id}>
                      <Td className="whitespace-nowrap">#{o.id}<p className="text-xs text-gray-500">{formatDate(o.createdAt, true)}</p></Td>
                      <Td>{o.apartmentName}<p className="text-xs text-gray-500">{o.guestName}</p></Td>
                      <Td className="text-gray-600">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</Td>
                      <Td className="whitespace-nowrap">{formatGHS(o.total)}</Td>
                      <Td><Badge color={o.status === 'delivered' ? 'green' : 'red'}>{o.status}</Badge></Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </>
        ))}

      {ordering && data && <StaffOrder data={data} onClose={() => setOrdering(false)} onDone={() => { setOrdering(false); reload(); }} />}
    </div>
  );
}

/* ── Staff order ───────────────────────────────────────────────────────── */

function StaffOrder({ data, onClose, onDone }: { data: Data; onClose: () => void; onDone: () => void }) {
  const [bookingId, setBookingId] = useState(data.stays[0]?.bookingId ?? 0);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const menu = data.menu.filter((d) => d.available);
  const total = menu.reduce((n, d) => n + (cart[d.id] ?? 0) * d.price, 0);
  const setQty = (id: number, q: number) => setCart({ ...cart, [id]: Math.max(0, Math.min(20, q)) });

  async function save() {
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/kitchen', {
        method: 'POST',
        json: { action: 'order', bookingId, notes, items: Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => ({ menuItemId: Number(id), qty })) },
      });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Order for a guest" wide>
      <div className="space-y-4 text-sm">
        <Field label="Charge to"><Select value={bookingId} options={data.stays.map((s) => ({ value: s.bookingId, label: `${s.apartmentName} — ${s.guestName} (${s.reference})` }))} onChange={(e) => setBookingId(Number(e.target.value))} /></Field>
        <div className="max-h-80 overflow-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
          {menu.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-3 py-2">
              <span>{d.name} <span className="text-gray-400">· {d.category}</span></span>
              <span className="flex items-center gap-2">
                <span className="text-gray-600 w-24 text-right">{formatGHS(d.price)}</span>
                <button onClick={() => setQty(d.id, (cart[d.id] ?? 0) - 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center" aria-label={`One less ${d.name}`}><Minus size={12} /></button>
                <span className="w-5 text-center">{cart[d.id] ?? 0}</span>
                <button onClick={() => setQty(d.id, (cart[d.id] ?? 0) + 1)} className="w-7 h-7 rounded-full bg-lime-400 flex items-center justify-center" aria-label={`Add ${d.name}`}><Plus size={12} /></button>
              </span>
            </div>
          ))}
        </div>
        <Field label="Notes for the kitchen" hint="optional"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <ErrorText>{err}</ErrorText>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total {formatGHS(total)}</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button loading={busy} disabled={total === 0} onClick={save}>Send to kitchen</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Menu editor ───────────────────────────────────────────────────────── */

function MenuEditor({ menu, canEdit, onChanged }: { menu: Dish[]; canEdit: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<Dish | 'new' | null>(null);
  const [err, setErr] = useState('');
  const categories = useMemo(() => [...new Set(menu.map((d) => d.category))], [menu]);

  async function toggle(d: Dish) {
    setErr('');
    try {
      await api('/api/admin/kitchen', { method: 'POST', json: { action: 'menu_update', id: d.id, item: { available: !d.available } } });
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <Card title={`Menu · ${menu.length} dishes`} actions={canEdit && <Button className="text-xs" onClick={() => setEditing('new')}><Plus size={13} /> Add dish</Button>} padded={false}>
      <ErrorText>{err}</ErrorText>
      <Table head={['Dish', 'Category', 'Price', 'On the menu', '']}>
        {menu.map((d) => (
          <tr key={d.id} className={cx(!d.available && 'opacity-60')}>
            <Td><p className="font-medium text-gray-900">{d.name}</p>{d.description && <p className="text-xs text-gray-500">{d.description}</p>}</Td>
            <Td>{d.category}</Td>
            <Td className="whitespace-nowrap">{formatGHS(d.price)}</Td>
            <Td>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" className="accent-lime-500" checked={d.available} disabled={!canEdit} onChange={() => toggle(d)} />
                {d.available ? 'Available' : 'Sold out / hidden'}
              </label>
            </Td>
            <Td>{canEdit && <button className="text-gray-400 hover:text-gray-700" onClick={() => setEditing(d)} aria-label={`Edit ${d.name}`}><Pencil size={14} /></button>}</Td>
          </tr>
        ))}
      </Table>
      {editing && <DishForm dish={editing === 'new' ? undefined : editing} categories={categories} onClose={() => setEditing(null)} onDone={() => { setEditing(null); onChanged(); }} />}
    </Card>
  );
}

function DishForm({ dish, categories, onClose, onDone }: { dish?: Dish; categories: string[]; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: dish?.name ?? '', description: dish?.description ?? '', category: dish?.category ?? categories[0] ?? 'Mains', price: dish ? String(dish.price / 100) : '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Modal open onClose={onClose} title={dish ? `Edit ${dish.name}` : 'Add dish'}>
      <div className="space-y-3 text-sm">
        <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Input list="dish-categories" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
            <datalist id="dish-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Price (GH₵)"><Input type="number" min="0" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
        </div>
        <Field label="Description" hint="optional"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        {dish && <p className="text-xs text-gray-500">A new price applies to new orders only.</p>}
        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!f.name.trim() || !f.price} onClick={async () => {
            setBusy(true); setErr('');
            try {
              await api('/api/admin/kitchen', { method: 'POST', json: dish ? { action: 'menu_update', id: dish.id, item: f } : { action: 'menu_add', item: f } });
              onDone();
            } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
          }}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
