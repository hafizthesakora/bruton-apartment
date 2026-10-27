'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Receipt, MessageSquare, LogOut, UtensilsCrossed } from 'lucide-react';

type Line = { id: number; type: 'charge' | 'payment' | 'refund'; description: string; amount: number; createdAt: string };
type Booking = {
  id: number; reference: string; status: string; checkIn: string; checkOut: string; nights: number; adults: number; children: number;
  apartmentName: string; charges: number; paid: number; balance: number; lines: Line[];
  receipts: { id: number; amount: number; method: string | null; createdAt: string }[];
  requests: { id: number; message: string; status: string; response: string; createdAt: string }[];
  canRequest: boolean;
};
type Account = { name: string | null; bookings: Booking[] };

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm bg-white';
const btnCls = 'bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2';
const ghs = (p: number) => `GH₵ ${(p / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d.length === 10 ? d + 'T00:00:00Z' : d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const STATUS: Record<string, [string, string]> = {
  pending_payment: ['Awaiting payment', 'bg-amber-100 text-amber-800'], confirmed: ['Confirmed', 'bg-blue-100 text-blue-800'],
  checked_in: ['Staying now', 'bg-lime-100 text-lime-800'], checked_out: ['Completed', 'bg-gray-100 text-gray-600'], cancelled: ['Cancelled', 'bg-red-100 text-red-700'],
};

async function call<T>(url: string, init?: { method?: string; json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: init?.json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status });
  return data as T;
}

export default function AccountClient() {
  const [account, setAccount] = useState<Account | null>(null);
  const [checking, setChecking] = useState(true);

  async function load() {
    try {
      setAccount(await call<Account>('/api/account'));
    } catch {
      setAccount(null);
    } finally {
      setChecking(false);
    }
  }
  useEffect(() => { load(); }, []);

  if (checking) return <p className="text-gray-500 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</p>;
  if (!account) return <SignIn onSignedIn={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-gray-700">Welcome back{account.name ? `, ${account.name.split(' ')[0]}` : ''}.</p>
        <button onClick={async () => { await call('/api/account', { method: 'DELETE' }).catch(() => null); setAccount(null); }}
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"><LogOut size={14} /> Sign out</button>
      </div>
      {account.bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-600">
          No bookings yet. <Link href="/book" className="text-lime-700 underline">Book a stay</Link>
        </div>
      ) : account.bookings.map((b) => <BookingCard key={b.id} b={b} onChanged={load} />)}
    </div>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<'contact' | 'code'>('contact');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await call<{ message: string }>('/api/account/login', { method: 'POST', json: { contact } });
      setMessage(r.message);
      setStep('code');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await call('/api/account/verify', { method: 'POST', json: { contact, code } });
      onSignedIn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      {step === 'contact' ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Sign in</h2>
            <p className="text-sm text-gray-500 mt-1">Enter the phone number or email you booked with. We’ll send you a code — no password needed.</p>
          </div>
          <input className={inputCls} placeholder="024 123 4567 or you@example.com" value={contact} onChange={(e) => setContact(e.target.value)} required autoComplete="email tel" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className={btnCls + ' w-full'}>{busy && <Loader2 size={16} className="animate-spin" />} Send me a code</button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Enter your code</h2>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
          <input className={inputCls + ' text-center text-2xl tracking-[0.5em]'} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy || code.length !== 6} className={btnCls + ' w-full'}>{busy && <Loader2 size={16} className="animate-spin" />} Sign in</button>
          <div className="flex justify-between text-sm">
            <button type="button" className="text-gray-500 underline" onClick={() => { setStep('contact'); setCode(''); setError(''); }}>Use a different number</button>
            <button type="button" className="text-gray-500 underline" disabled={busy} onClick={() => sendCode()}>Send a new code</button>
          </div>
        </form>
      )}
    </div>
  );
}

function BookingCard({ b, onChanged }: { b: Booking; onChanged: () => void }) {
  const [showBill, setShowBill] = useState(false);
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [label, cls] = STATUS[b.status] ?? [b.status, 'bg-gray-100 text-gray-600'];
  const guests = b.adults + b.children;

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await call('/api/account/requests', { method: 'POST', json: { bookingId: b.id, message } });
      setMessage('');
      setAsking(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold">{b.apartmentName}</h2>
            <p className="text-gray-600 text-sm">{day(b.checkIn)} → {day(b.checkOut)} · {b.nights} night{b.nights === 1 ? '' : 's'} · {guests} guest{guests === 1 ? '' : 's'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Booking {b.reference}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 text-xs">Total</p><p className="font-semibold">{ghs(b.charges)}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 text-xs">Paid</p><p className="font-semibold text-lime-700">{ghs(b.paid)}</p></div>
          <div className={`rounded-lg p-3 ${b.balance > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}><p className="text-gray-500 text-xs">{b.balance < 0 ? 'In credit' : 'To pay'}</p><p className="font-semibold">{ghs(Math.abs(b.balance))}</p></div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <button onClick={() => setShowBill(!showBill)} className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 underline"><Receipt size={14} /> {showBill ? 'Hide bill' : 'View bill & receipts'}</button>
          {b.canRequest && <button onClick={() => setAsking(!asking)} className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 underline"><MessageSquare size={14} /> Ask for a change</button>}
          {b.status === 'checked_in' && <Link href="/room-service" className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 underline"><UtensilsCrossed size={14} /> Room service</Link>}
        </div>

        {showBill && (
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {b.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{day(l.createdAt)}</td>
                    <td className="py-2 pr-3">{l.description}</td>
                    <td className={`py-2 text-right whitespace-nowrap ${l.type === 'payment' ? 'text-lime-700' : ''}`}>{l.type === 'payment' ? `−${ghs(l.amount)}` : ghs(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {b.receipts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {b.receipts.map((r) => (
                  <Link key={r.id} href={`/account/receipt/${r.id}`} target="_blank" className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50">
                    Receipt · {ghs(r.amount)} · {day(r.createdAt)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {asking && (
          <form onSubmit={ask} className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm text-gray-600">Tell the front desk what you’d like — different dates, an extra guest, an early check-in… We’ll reply by email or SMS.</p>
            <textarea className={inputCls} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={busy || message.trim().length < 5} className={btnCls}>{busy && <Loader2 size={16} className="animate-spin" />} Send request</button>
          </form>
        )}

        {b.requests.length > 0 && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            {b.requests.map((r) => (
              <div key={r.id} className="text-sm space-y-1">
                <p className="text-gray-500 text-xs">You asked on {day(r.createdAt)}</p>
                <p className="bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-line">{r.message}</p>
                {r.status === 'open' ? <p className="text-amber-700 text-xs">Waiting for the front desk</p>
                  : r.response ? <p className="bg-lime-50 rounded-lg px-3 py-2 whitespace-pre-line"><b>Bruton Gardens:</b> {r.response}</p>
                  : <p className="text-gray-500 text-xs">Handled by the front desk</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
