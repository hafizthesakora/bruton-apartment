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

const inputCls = 'w-full px-5 py-3 rounded-2xl border border-garden/15 bg-white/70 focus:outline-none focus:border-brass focus:ring-4 focus:ring-brass/15 transition text-[0.95rem]';
const btnCls = 'bg-brass hover:bg-brass-dark text-white font-medium tracking-wide px-7 py-3 rounded-full transition-colors duration-500 disabled:opacity-60 flex items-center justify-center gap-2';
const ghs = (p: number) => `GH₵ ${(p / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d.length === 10 ? d + 'T00:00:00Z' : d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const STATUS: Record<string, [string, string]> = {
  pending_payment: ['Awaiting payment', 'bg-brass/15 text-brass-dark'], confirmed: ['Confirmed', 'bg-garden text-ivory'],
  checked_in: ['Staying now', 'bg-sage/25 text-garden'], checked_out: ['Completed', 'bg-sand text-ink/60'], cancelled: ['Cancelled', 'bg-red-100 text-red-700'],
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

  if (checking) return <p className="text-ink/55 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</p>;
  if (!account) return <SignIn onSignedIn={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-ink/75">Welcome back{account.name ? `, ${account.name.split(' ')[0]}` : ''}.</p>
        <button onClick={async () => { await call('/api/account', { method: 'DELETE' }).catch(() => null); setAccount(null); }}
          className="text-sm text-ink/55 hover:text-garden flex items-center gap-1"><LogOut size={14} /> Sign out</button>
      </div>
      {account.bookings.length === 0 ? (
        <div className="bg-white/60 backdrop-blur rounded-[2rem] border border-garden/10 p-8 text-center text-ink/60">
          No bookings yet. <Link href="/book" className="text-brass-dark underline">Book a stay</Link>
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
    <div className="max-w-md bg-white/60 backdrop-blur rounded-[2rem] border border-garden/10 shadow-[0_20px_60px_-35px_rgba(31,59,45,0.35)] p-6 space-y-4">
      {step === 'contact' ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-garden">Sign in</h2>
            <p className="text-sm text-ink/55 mt-1">Enter the phone number or email you booked with. We’ll send you a code — no password needed.</p>
          </div>
          <input className={inputCls} placeholder="024 123 4567 or you@example.com" value={contact} onChange={(e) => setContact(e.target.value)} required autoComplete="email tel" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className={btnCls + ' w-full'}>{busy && <Loader2 size={16} className="animate-spin" />} Send me a code</button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-garden">Enter your code</h2>
            <p className="text-sm text-ink/55 mt-1">{message}</p>
          </div>
          <input className={inputCls + ' text-center text-2xl tracking-[0.5em]'} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button disabled={busy || code.length !== 6} className={btnCls + ' w-full'}>{busy && <Loader2 size={16} className="animate-spin" />} Sign in</button>
          <div className="flex justify-between text-sm">
            <button type="button" className="text-ink/55 underline" onClick={() => { setStep('contact'); setCode(''); setError(''); }}>Use a different number</button>
            <button type="button" className="text-ink/55 underline" disabled={busy} onClick={() => sendCode()}>Send a new code</button>
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
  const [label, cls] = STATUS[b.status] ?? [b.status, 'bg-sand text-ink/60'];
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
    <div className="bg-white/60 backdrop-blur rounded-[2rem] border border-garden/10 shadow-[0_20px_60px_-35px_rgba(31,59,45,0.35)] overflow-hidden">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h2 className="font-display text-3xl text-garden">{b.apartmentName}</h2>
            <p className="text-ink/60 text-sm">{day(b.checkIn)} → {day(b.checkOut)} · {b.nights} night{b.nights === 1 ? '' : 's'} · {guests} guest{guests === 1 ? '' : 's'}</p>
            <p className="text-xs text-ink/40 mt-0.5">Booking {b.reference}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-sand/40 rounded-lg p-3"><p className="text-ink/55 text-xs">Total</p><p className="font-semibold">{ghs(b.charges)}</p></div>
          <div className="bg-sand/40 rounded-lg p-3"><p className="text-ink/55 text-xs">Paid</p><p className="font-semibold text-brass-dark">{ghs(b.paid)}</p></div>
          <div className={`rounded-lg p-3 ${b.balance > 0 ? 'bg-brass/10' : 'bg-sand/40'}`}><p className="text-ink/55 text-xs">{b.balance < 0 ? 'In credit' : 'To pay'}</p><p className="font-semibold">{ghs(Math.abs(b.balance))}</p></div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <button onClick={() => setShowBill(!showBill)} className="flex items-center gap-1.5 text-ink/75 hover:text-garden underline"><Receipt size={14} /> {showBill ? 'Hide bill' : 'View bill & receipts'}</button>
          {b.canRequest && <button onClick={() => setAsking(!asking)} className="flex items-center gap-1.5 text-ink/75 hover:text-garden underline"><MessageSquare size={14} /> Ask for a change</button>}
          {b.status === 'checked_in' && <Link href="/room-service" className="flex items-center gap-1.5 text-ink/75 hover:text-garden underline"><UtensilsCrossed size={14} /> Room service</Link>}
        </div>

        {showBill && (
          <div className="border-t border-garden/10 pt-4 space-y-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-garden/10">
                {b.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-3 text-ink/55 whitespace-nowrap">{day(l.createdAt)}</td>
                    <td className="py-2 pr-3">{l.description}</td>
                    <td className={`py-2 text-right whitespace-nowrap ${l.type === 'payment' ? 'text-brass-dark' : ''}`}>{l.type === 'payment' ? `−${ghs(l.amount)}` : ghs(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {b.receipts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {b.receipts.map((r) => (
                  <Link key={r.id} href={`/account/receipt/${r.id}`} target="_blank" className="text-xs px-3 py-1.5 rounded-full border border-garden/15 hover:bg-sand/50">
                    Receipt · {ghs(r.amount)} · {day(r.createdAt)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {asking && (
          <form onSubmit={ask} className="border-t border-garden/10 pt-4 space-y-3">
            <p className="text-sm text-ink/60">Tell the front desk what you’d like — different dates, an extra guest, an early check-in… We’ll reply by email or SMS.</p>
            <textarea className={inputCls} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} required />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button disabled={busy || message.trim().length < 5} className={btnCls}>{busy && <Loader2 size={16} className="animate-spin" />} Send request</button>
          </form>
        )}

        {b.requests.length > 0 && (
          <div className="border-t border-garden/10 pt-4 space-y-3">
            {b.requests.map((r) => (
              <div key={r.id} className="text-sm space-y-1">
                <p className="text-ink/55 text-xs">You asked on {day(r.createdAt)}</p>
                <p className="bg-sand/40 rounded-lg px-3 py-2 whitespace-pre-line">{r.message}</p>
                {r.status === 'open' ? <p className="text-brass-dark text-xs">Waiting for the front desk</p>
                  : r.response ? <p className="bg-sage/15 rounded-lg px-3 py-2 whitespace-pre-line"><b>Bruton Gardens:</b> {r.response}</p>
                  : <p className="text-ink/55 text-xs">Handled by the front desk</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
