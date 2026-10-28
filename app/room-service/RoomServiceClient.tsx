'use client';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Minus, Plus, CheckCircle2 } from 'lucide-react';

type Dish = { id: number; name: string; description: string; category: string; price: number };
type Stay = { bookingId: number; reference: string; apartmentName: string; firstName: string };
type PastOrder = { id: number; status: string; total: number; createdAt: string; items: { name: string; qty: number }[] };

const inputCls = 'w-full px-5 py-3 rounded-2xl border border-garden/15 bg-white/70 focus:outline-none focus:border-brass focus:ring-4 focus:ring-brass/15 transition text-[0.95rem]';
const ghs = (p: number) => `GH₵ ${(p / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS: Record<string, string> = { received: 'Received', preparing: 'Being prepared', delivered: 'Delivered', cancelled: 'Cancelled' };
const KEY = 'bruton-room-service';

async function call<T>(json: unknown): Promise<T> {
  const res = await fetch('/api/room-service', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong — please call the front desk');
  return data as T;
}

export default function RoomServiceClient() {
  const [menu, setMenu] = useState<Dish[] | null>(null);
  const [who, setWho] = useState({ reference: '', contact: '' });
  const [stay, setStay] = useState<Stay | null>(null);
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/room-service').then((r) => r.json()).then(setMenu).catch(() => setMenu([]));
    // Remember the guest's details on this device for the rest of their stay.
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (saved?.reference && saved?.contact) { setWho(saved); lookup(saved); }
    } catch { /* storage unavailable */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function lookup(w = who) {
    setBusy(true);
    setError('');
    try {
      const r = await call<{ stay: Stay; orders: PastOrder[] }>({ action: 'lookup', ...w });
      setStay(r.stay);
      setOrders(r.orders);
      try { localStorage.setItem(KEY, JSON.stringify(w)); } catch { /* ignore */ }
    } catch (e) {
      setError((e as Error).message);
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    } finally {
      setBusy(false);
    }
  }

  async function order() {
    setBusy(true);
    setError('');
    try {
      const r = await call<{ order: { id: number } }>({
        action: 'order', ...who, notes,
        items: Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => ({ menuItemId: Number(id), qty })),
      });
      setPlaced(r.order.id);
      setCart({});
      setNotes('');
      await lookup();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const categories = useMemo(() => [...new Set(menu?.map((d) => d.category) ?? [])], [menu]);
  const total = menu?.reduce((n, d) => n + (cart[d.id] ?? 0) * d.price, 0) ?? 0;
  const count = Object.values(cart).reduce((n, q) => n + q, 0);
  const setQty = (id: number, q: number) => setCart({ ...cart, [id]: Math.max(0, Math.min(20, q)) });

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
      <div className="space-y-8">
        {menu === null ? <p className="text-ink/55 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading the menu…</p>
          : menu.length === 0 ? <p className="text-ink/55">The kitchen menu isn’t available right now — please call the front desk.</p>
          : categories.map((c) => (
            <section key={c}>
              <h2 className="font-display text-3xl text-garden mb-5">{c}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {menu.filter((d) => d.category === c).map((d) => (
                  <div key={d.id} className="bg-white/60 rounded-[1.5rem] border border-garden/10 transition-colors duration-500 hover:border-brass/40 p-4 flex flex-col">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium text-garden">{d.name}</p>
                      <p className="font-display text-xl text-brass-dark whitespace-nowrap">{ghs(d.price)}</p>
                    </div>
                    {d.description && <p className="text-sm text-ink/55 mt-1">{d.description}</p>}
                    {stay && (
                      <div className="mt-3 flex items-center gap-2 self-end">
                        {(cart[d.id] ?? 0) > 0 && (
                          <>
                            <button onClick={() => setQty(d.id, (cart[d.id] ?? 0) - 1)} className="w-8 h-8 rounded-full border border-garden/20 flex items-center justify-center hover:bg-sand/50" aria-label={`One less ${d.name}`}><Minus size={14} /></button>
                            <span className="w-6 text-center font-medium">{cart[d.id]}</span>
                          </>
                        )}
                        <button onClick={() => setQty(d.id, (cart[d.id] ?? 0) + 1)} className="w-8 h-8 rounded-full bg-brass hover:bg-brass-dark text-white transition-colors flex items-center justify-center" aria-label={`Add ${d.name}`}><Plus size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>

      <aside className="lg:sticky lg:top-28 space-y-4">
        {!stay ? (
          <form onSubmit={(e) => { e.preventDefault(); lookup(); }} className="bg-white/60 backdrop-blur rounded-[2rem] border border-garden/10 shadow-[0_20px_60px_-35px_rgba(31,59,45,0.35)] p-5 space-y-3">
            <h2 className="font-display text-2xl text-garden">Order to your apartment</h2>
            <p className="text-sm text-ink/55">For guests who have checked in. Use the reference from your booking confirmation.</p>
            <label className="block">
              <span className="block eyebrow text-[0.65rem] text-brass mb-2">Booking reference</span>
              <input className={inputCls + ' uppercase'} placeholder="BG…" value={who.reference} onChange={(e) => setWho({ ...who, reference: e.target.value })} required />
            </label>
            <label className="block">
              <span className="block eyebrow text-[0.65rem] text-brass mb-2">Phone or email on the booking</span>
              <input className={inputCls} value={who.contact} onChange={(e) => setWho({ ...who, contact: e.target.value })} required />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="w-full bg-brass hover:bg-brass-dark text-white font-medium tracking-wide px-7 py-3 rounded-full transition-colors duration-500 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy && <Loader2 size={16} className="animate-spin" />} Continue
            </button>
          </form>
        ) : (
          <div className="bg-white/60 backdrop-blur rounded-[2rem] border border-garden/10 shadow-[0_20px_60px_-35px_rgba(31,59,45,0.35)] p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display text-2xl text-garden">Hi {stay.firstName}</h2>
                <p className="text-sm text-ink/55">Delivering to {stay.apartmentName}</p>
              </div>
              <button className="text-xs text-ink/55 underline" onClick={() => { setStay(null); setOrders([]); try { localStorage.removeItem(KEY); } catch { /* ignore */ } }}>Not you?</button>
            </div>
            {placed && (
              <p className="flex items-center gap-2 bg-sage/15 border border-sage/30 text-garden rounded-lg px-3 py-2 text-sm">
                <CheckCircle2 size={16} /> Order #{placed} sent to the kitchen.
              </p>
            )}
            {count === 0 ? <p className="text-sm text-ink/55">Tap + on a dish to add it.</p> : (
              <>
                <ul className="text-sm space-y-1">
                  {menu?.filter((d) => cart[d.id]).map((d) => (
                    <li key={d.id} className="flex justify-between"><span>{cart[d.id]}× {d.name}</span><span>{ghs(cart[d.id] * d.price)}</span></li>
                  ))}
                </ul>
                <div className="flex justify-between font-semibold border-t border-garden/10 pt-2"><span>Total</span><span>{ghs(total)}</span></div>
                <textarea className={inputCls} rows={2} placeholder="Anything the kitchen should know? (allergies, no pepper…)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                {error && <p className="text-sm text-red-700">{error}</p>}
                <button onClick={order} disabled={busy} className="w-full bg-brass hover:bg-brass-dark text-white font-medium tracking-wide px-7 py-3 rounded-full transition-colors duration-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {busy && <Loader2 size={16} className="animate-spin" />} Place order · charge to my bill
                </button>
              </>
            )}
          </div>
        )}

        {stay && orders.length > 0 && (
          <div className="bg-white/60 backdrop-blur rounded-[2rem] border border-garden/10 p-5 space-y-3">
            <h3 className="eyebrow text-brass">Your recent orders</h3>
            {orders.map((o) => (
              <div key={o.id} className="text-sm border-t border-garden/10 pt-2 first:border-0 first:pt-0">
                <div className="flex justify-between"><span className="font-medium">#{o.id} · {STATUS[o.status] ?? o.status}</span><span>{ghs(o.total)}</span></div>
                <p className="text-ink/55">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
              </div>
            ))}
            <button onClick={() => lookup()} className="text-xs text-ink/55 underline">Refresh</button>
          </div>
        )}
      </aside>
    </div>
  );
}
