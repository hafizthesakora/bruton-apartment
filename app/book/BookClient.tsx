'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { BedDouble, Bath, Users, Check, ChevronLeft, Loader2, ShieldCheck, CalendarDays } from 'lucide-react';
import { formatGHS } from '@/lib/money';
import { addDays, todayAtProperty } from '@/lib/booking/pricing';
import type { SearchResult } from '@/lib/booking/engine';
import type { PaymentModeOption } from '@/lib/booking/pricing';

type Policy = { depositPct: number; holdMinutes: number; checkInTime: string; checkOutTime: string; cancellationText: string };
type SearchResponse = { apartments: SearchResult[]; paymentOptions: PaymentModeOption[]; policy: Policy };

const PAYMENT_LABELS: Record<PaymentModeOption, { title: string; hint: (p: Policy) => string }> = {
  full: { title: 'Pay in full now', hint: () => 'Mobile Money or card via Paystack' },
  deposit: { title: 'Pay a deposit now', hint: (p) => `${p.depositPct}% now, the rest at check-in` },
  pay_on_arrival: { title: 'Pay on arrival', hint: () => 'Cash, Mobile Money or transfer at check-in' },
};

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm bg-white';

export default function BookClient() {
  const router = useRouter();
  const params = useSearchParams();
  const today = todayAtProperty();

  const [checkIn, setCheckIn] = useState(params.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(params.get('checkOut') || addDays(today, 2));
  const [guests, setGuests] = useState(Number(params.get('guests')) || 2);

  const [result, setResult] = useState<SearchResponse | null>(null);
  const [searched, setSearched] = useState<{ checkIn: string; checkOut: string; guests: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SearchResult | null>(null);

  const search = useCallback(async (q: { checkIn: string; checkOut: string; guests: number }) => {
    setLoading(true);
    setError('');
    setSelected(null);
    try {
      const qs = new URLSearchParams({ checkIn: q.checkIn, checkOut: q.checkOut, guests: String(q.guests) });
      const res = await fetch(`/api/booking/availability?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResult(data);
      setSearched(q);
      router.replace(`/book?${qs}`, { scroll: false });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Deep links from "Book Now" buttons (/book?checkIn=…) search straight away.
  useEffect(() => {
    if (params.get('checkIn') && params.get('checkOut')) search({ checkIn, checkOut, guests });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    search({ checkIn, checkOut, guests });
  };

  return (
    <div className="space-y-8">
      {!selected && (
        <form onSubmit={onSearch} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">
          <label className="block">
            <span className="block text-sm font-medium mb-1">Check-in</span>
            <input type="date" className={inputCls} value={checkIn} min={today} required
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
              }} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Check-out</span>
            <input type="date" className={inputCls} value={checkOut} min={addDays(checkIn, 1)} required
              onChange={(e) => setCheckOut(e.target.value)} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Guests</span>
            <select className={inputCls} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="submit" disabled={loading}
            className="bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Search
          </button>
        </form>
      )}

      {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {result && searched && !selected && (
        <Results result={result} searched={searched} onSelect={setSelected} />
      )}

      {result && searched && selected && (
        <Checkout
          apartment={selected}
          searched={searched}
          policy={result.policy}
          paymentOptions={result.paymentOptions}
          onBack={() => setSelected(null)}
          onUnavailable={(msg) => { setError(msg); search(searched); }}
        />
      )}
    </div>
  );
}

function Results({ result, searched, onSelect }: {
  result: SearchResponse;
  searched: { checkIn: string; checkOut: string; guests: number };
  onSelect: (a: SearchResult) => void;
}) {
  const available = result.apartments.filter((a) => a.available);
  const unavailable = result.apartments.filter((a) => !a.available);

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        {available.length
          ? `${available.length} apartment${available.length === 1 ? '' : 's'} available · ${fmtDate(searched.checkIn)} → ${fmtDate(searched.checkOut)}`
          : 'Nothing is free for those dates — try different dates, or contact us and we’ll help.'}
      </p>
      {[...available, ...unavailable].map((a) => (
        <div key={a.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row ${a.available ? '' : 'opacity-60'}`}>
          <div className="relative md:w-72 h-48 md:h-auto shrink-0 bg-gray-100">
            {a.photos[0] && <Image src={a.photos[0].url} alt={a.photos[0].alt || a.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 288px" />}
          </div>
          <div className="p-5 flex-1 flex flex-col gap-3">
            <div>
              <h3 className="text-xl font-semibold">{a.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{a.description}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <span className="flex items-center gap-1.5"><BedDouble size={16} /> {a.bedrooms} bed</span>
              <span className="flex items-center gap-1.5"><Bath size={16} /> {a.bathrooms} bath</span>
              <span className="flex items-center gap-1.5"><Users size={16} /> Sleeps {a.maxGuests}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {a.amenities.slice(0, 6).map((am) => (
                <span key={am} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">{am}</span>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
              {a.available && a.quote ? (
                <>
                  <div>
                    <p className="text-2xl font-semibold">{formatGHS(a.quote.total)}</p>
                    <p className="text-xs text-gray-500">
                      {a.quote.nights} night{a.quote.nights === 1 ? '' : 's'}
                      {a.quote.discountPct > 0 && <span className="text-lime-700"> · {a.quote.discountPct}% long-stay discount</span>}
                    </p>
                  </div>
                  <button onClick={() => onSelect(a)}
                    className="bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold px-6 py-2.5 rounded-lg transition-colors">
                    Select
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">{a.reason}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Checkout({ apartment, searched, policy, paymentOptions, onBack, onUnavailable }: {
  apartment: SearchResult;
  searched: { checkIn: string; checkOut: string; guests: number };
  policy: Policy;
  paymentOptions: PaymentModeOption[];
  onBack: () => void;
  onUnavailable: (msg: string) => void;
}) {
  const router = useRouter();
  const quote = apartment.quote!;
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', notes: '' });
  const [adults, setAdults] = useState(Math.min(searched.guests, apartment.maxGuests));
  const [children, setChildren] = useState(0);
  const [mode, setMode] = useState<PaymentModeOption>(paymentOptions[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dueNow = mode === 'full' ? quote.total : mode === 'deposit' ? Math.round((quote.total * policy.depositPct) / 100) : 0;
  const weekendNights = quote.lines.filter((l) => l.weekend).length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/booking/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId: apartment.id, checkIn: searched.checkIn, checkOut: searched.checkOut,
          adults, children, paymentMode: mode, notes: form.notes,
          guest: { fullName: form.fullName, email: form.email, phone: form.phone },
        }),
      });
      const data = await res.json();
      if (res.status === 409) return onUnavailable(data.error);
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      router.push(`/book/${data.reference}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 order-2 lg:order-1">
        <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
          <ChevronLeft size={16} /> Back to apartments
        </button>

        <div>
          <h2 className="text-xl font-semibold mb-3">Your details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium mb-1">Full name *</span>
              <input className={inputCls} required autoComplete="name" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Email *</span>
              <input type="email" className={inputCls} required autoComplete="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Phone (WhatsApp preferred) *</span>
              <input type="tel" className={inputCls} required autoComplete="tel" placeholder="+233 …" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Adults</span>
              <select className={inputCls} value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {Array.from({ length: apartment.maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Children</span>
              <select className={inputCls} value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                {Array.from({ length: Math.max(0, apartment.maxGuests - adults) + 1 }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-sm font-medium mb-1">Anything we should know?</span>
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Arrival time, special requests…" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Payment</h2>
          <div className="space-y-2">
            {paymentOptions.map((opt) => (
              <label key={opt} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${mode === opt ? 'border-lime-400 bg-lime-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="mode" className="mt-1 accent-lime-500" checked={mode === opt} onChange={() => setMode(opt)} />
                <span>
                  <span className="block font-medium">{PAYMENT_LABELS[opt].title}</span>
                  <span className="block text-sm text-gray-600">{PAYMENT_LABELS[opt].hint(policy)}</span>
                </span>
              </label>
            ))}
          </div>
          {policy.cancellationText && <p className="text-xs text-gray-500 mt-3">{policy.cancellationText}</p>}
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <button type="submit" disabled={submitting}
          className="w-full bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {dueNow > 0 ? `Continue to payment · ${formatGHS(dueNow)}` : 'Confirm booking'}
        </button>
        {dueNow > 0 && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5 justify-center">
            <ShieldCheck size={14} /> Secure payment by Paystack. We hold the apartment for {policy.holdMinutes} minutes while you pay.
          </p>
        )}
      </form>

      <aside className="bg-white rounded-2xl border border-gray-200 overflow-hidden order-1 lg:order-2 lg:sticky lg:top-32">
        <div className="relative h-40 bg-gray-100">
          {apartment.photos[0] && <Image src={apartment.photos[0].url} alt={apartment.name} fill className="object-cover" sizes="360px" />}
        </div>
        <div className="p-5 space-y-4 text-sm">
          <h3 className="text-lg font-semibold">{apartment.name}</h3>
          <div className="flex items-start gap-2 text-gray-700">
            <CalendarDays size={16} className="mt-0.5 shrink-0" />
            <div>
              <p>{fmtDate(searched.checkIn)} → {fmtDate(searched.checkOut)}</p>
              <p className="text-gray-500 text-xs">Check-in from {policy.checkInTime} · check-out by {policy.checkOutTime}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-1.5">
            {quote.nights - weekendNights > 0 && (
              <Row label={`${quote.nights - weekendNights} weeknight${quote.nights - weekendNights === 1 ? '' : 's'}`}
                value={formatGHS(quote.lines.filter((l) => !l.weekend).reduce((s, l) => s + l.rate, 0))} />
            )}
            {weekendNights > 0 && (
              <Row label={`${weekendNights} weekend night${weekendNights === 1 ? '' : 's'}`}
                value={formatGHS(quote.lines.filter((l) => l.weekend).reduce((s, l) => s + l.rate, 0))} />
            )}
            {quote.discount > 0 && <Row label={`Long-stay discount (${quote.discountPct}%)`} value={`− ${formatGHS(quote.discount)}`} accent />}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
              <span>Total</span><span>{formatGHS(quote.total)}</span>
            </div>
            {dueNow > 0 && dueNow < quote.total && <Row label="Due now" value={formatGHS(dueNow)} />}
            {dueNow < quote.total && <Row label="Due at check-in" value={formatGHS(quote.total - dueNow)} />}
          </div>
          <ul className="space-y-1 text-gray-600">
            {apartment.amenities.slice(0, 4).map((am) => (
              <li key={am} className="flex items-center gap-2"><Check size={14} className="text-lime-600" /> {am}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-lime-700' : 'text-gray-700'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
