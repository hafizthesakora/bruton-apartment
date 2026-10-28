'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BedDouble, Bath, Users, Check, ChevronLeft, ChevronRight, Loader2, ShieldCheck, CalendarDays, Search } from 'lucide-react';
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

const EASE = [0.22, 1, 0.36, 1] as const;

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const inputCls = 'w-full px-5 py-3.5 rounded-2xl border border-garden/15 bg-white/70 focus:outline-none focus:border-brass focus:ring-4 focus:ring-brass/15 transition text-[0.95rem]';
const labelCls = 'block eyebrow text-[0.65rem] text-brass mb-2';
const errorCls = 'bg-red-50 text-red-800 border border-red-200 px-5 py-4 rounded-2xl text-sm';

const STEPS = ['Dates', 'Apartment', 'Details & payment'];

function Steps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3 text-sm">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-3">
          <span className={`flex size-8 items-center justify-center rounded-full border text-xs transition-colors duration-500 ${
            i < current ? 'border-garden bg-garden text-ivory' : i === current ? 'border-brass bg-brass text-white' : 'border-garden/20 text-garden/50'
          }`}>
            {i < current ? <Check size={14} /> : i + 1}
          </span>
          <span className={`hidden sm:inline ${i === current ? 'text-garden' : 'text-ink/45'}`}>{label}</span>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-garden/20 sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}

export default function BookClient() {
  const router = useRouter();
  const params = useSearchParams();
  const today = todayAtProperty();
  const preferred = params.get('apartment');

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
      if (preferred) qs.set('apartment', preferred);
      router.replace(`/book?${qs}`, { scroll: false });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [router, preferred]);

  // Deep links from "Book Now" buttons (/book?checkIn=…) and apartment cards (/book?apartment=…) search straight away.
  useEffect(() => {
    if ((params.get('checkIn') && params.get('checkOut')) || preferred) search({ checkIn, checkOut, guests });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    search({ checkIn, checkOut, guests });
  };

  const step = selected ? 2 : result ? 1 : 0;

  return (
    <div className="space-y-10">
      <Steps current={step} />

      <AnimatePresence mode="wait">
        {!selected && (
          <motion.form
            key="search"
            onSubmit={onSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="grid grid-cols-1 items-end gap-4 rounded-[2rem] border border-garden/10 bg-white/60 p-5 shadow-[0_20px_60px_-30px_rgba(31,59,45,0.35)] backdrop-blur sm:grid-cols-[1fr_1fr_auto_auto] md:p-6"
          >
            <label className="block">
              <span className={labelCls}>Check-in</span>
              <input type="date" className={inputCls} value={checkIn} min={today} required
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
                }} />
            </label>
            <label className="block">
              <span className={labelCls}>Check-out</span>
              <input type="date" className={inputCls} value={checkOut} min={addDays(checkIn, 1)} required
                onChange={(e) => setCheckOut(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelCls}>Guests</span>
              <select className={inputCls} value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button type="submit" disabled={loading}
              className="flex h-[3.2rem] items-center justify-center gap-2 rounded-full bg-brass px-8 font-medium tracking-wide text-white transition-colors duration-500 hover:bg-brass-dark disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {error && <div className={errorCls}>{error}</div>}

      <AnimatePresence mode="wait">
        {result && searched && !selected && (
          <motion.div key={`results-${searched.checkIn}-${searched.checkOut}-${searched.guests}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <Results result={result} searched={searched} preferred={preferred} onSelect={(a) => { setSelected(a); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </motion.div>
        )}

        {result && searched && selected && (
          <motion.div key="checkout" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.6, ease: EASE }}>
            <Checkout
              apartment={selected}
              searched={searched}
              policy={result.policy}
              paymentOptions={result.paymentOptions}
              onBack={() => setSelected(null)}
              onUnavailable={(msg) => { setError(msg); search(searched); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Results({ result, searched, preferred, onSelect }: {
  result: SearchResponse;
  searched: { checkIn: string; checkOut: string; guests: number };
  preferred: string | null;
  onSelect: (a: SearchResult) => void;
}) {
  const byPreference = (a: SearchResult, b: SearchResult) => Number(b.slug === preferred) - Number(a.slug === preferred);
  const available = result.apartments.filter((a) => a.available).sort(byPreference);
  const unavailable = result.apartments.filter((a) => !a.available).sort(byPreference);

  return (
    <div className="space-y-6">
      <p className="text-ink/60">
        {available.length
          ? `${available.length} apartment${available.length === 1 ? '' : 's'} available · ${fmtDate(searched.checkIn)} → ${fmtDate(searched.checkOut)}`
          : 'Nothing is free for those dates — try different dates, or contact us and we’ll help.'}
      </p>
      {[...available, ...unavailable].map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: a.available ? 1 : 0.55, y: 0 }}
          transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
          className={`group flex flex-col overflow-hidden rounded-[2rem] border bg-white/70 md:flex-row ${
            a.slug === preferred && a.available ? 'border-brass ring-4 ring-brass/15' : 'border-garden/10'
          }`}
        >
          <div className="relative h-60 shrink-0 overflow-hidden bg-sand md:h-auto md:w-80">
            <Photos photos={a.photos} name={a.name} sizes="(max-width: 768px) 100vw, 320px" />
          </div>
          <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
            <div>
              <h3 className="font-display text-3xl text-garden">{a.name}</h3>
              <p className="mt-2 text-ink/60">{a.description}</p>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-ink/70">
              <span className="flex items-center gap-2"><BedDouble size={16} className="text-brass" /> {a.bedrooms} bed</span>
              <span className="flex items-center gap-2"><Bath size={16} className="text-brass" /> {a.bathrooms} bath</span>
              <span className="flex items-center gap-2"><Users size={16} className="text-brass" /> Sleeps {a.maxGuests}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {a.amenities.slice(0, 6).map((am) => (
                <span key={am} className="rounded-full border border-garden/10 px-3 py-1 text-xs text-ink/65">{am}</span>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-garden/10 pt-5">
              {a.available && a.quote ? (
                <>
                  <div>
                    <p className="font-display text-4xl text-garden">{formatGHS(a.quote.total)}</p>
                    <p className="mt-1 text-xs text-ink/50">
                      {a.quote.nights} night{a.quote.nights === 1 ? '' : 's'}
                      {a.quote.discountPct > 0 && <span className="text-brass-dark"> · {a.quote.discountPct}% long-stay discount</span>}
                    </p>
                  </div>
                  <button onClick={() => onSelect(a)}
                    className="rounded-full bg-garden px-8 py-3 text-sm font-medium tracking-wide text-ivory transition-colors duration-500 hover:bg-brass">
                    Select
                  </button>
                </>
              ) : (
                <p className="text-sm text-ink/50">{a.reason}</p>
              )}
            </div>
          </div>
        </motion.div>
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
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="order-2 space-y-10 rounded-[2rem] border border-garden/10 bg-white/60 p-6 md:p-10 lg:order-1">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-ink/55 transition-colors hover:text-garden">
          <ChevronLeft size={16} /> Back to apartments
        </button>

        <div>
          <h2 className="font-display mb-6 text-4xl text-garden">Your details</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>Full name *</span>
              <input className={inputCls} required autoComplete="name" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Email *</span>
              <input type="email" className={inputCls} required autoComplete="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Phone (WhatsApp preferred) *</span>
              <input type="tel" className={inputCls} required autoComplete="tel" placeholder="+233 …" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block">
              <span className={labelCls}>Adults</span>
              <select className={inputCls} value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {Array.from({ length: apartment.maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Children</span>
              <select className={inputCls} value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                {Array.from({ length: Math.max(0, apartment.maxGuests - adults) + 1 }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Anything we should know?</span>
              <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Arrival time, special requests…" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
        </div>

        <div>
          <h2 className="font-display mb-6 text-4xl text-garden">Payment</h2>
          <div className="space-y-3">
            {paymentOptions.map((opt) => (
              <label key={opt} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all duration-300 ${mode === opt ? 'border-brass bg-brass/5 ring-4 ring-brass/10' : 'border-garden/15 hover:border-garden/30'}`}>
                <input type="radio" name="mode" className="mt-1 accent-[#B08D57]" checked={mode === opt} onChange={() => setMode(opt)} />
                <span>
                  <span className="block font-medium text-garden">{PAYMENT_LABELS[opt].title}</span>
                  <span className="mt-0.5 block text-sm text-ink/55">{PAYMENT_LABELS[opt].hint(policy)}</span>
                </span>
              </label>
            ))}
          </div>
          {policy.cancellationText && <p className="mt-4 text-xs leading-relaxed text-ink/50">{policy.cancellationText}</p>}
        </div>

        {error && <div className={errorCls}>{error}</div>}

        <div>
          <button type="submit" disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brass py-4 font-medium tracking-wide text-white transition-colors duration-500 hover:bg-brass-dark disabled:opacity-60">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {dueNow > 0 ? `Continue to payment · ${formatGHS(dueNow)}` : 'Confirm booking'}
          </button>
          {dueNow > 0 && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink/50">
              <ShieldCheck size={14} /> Secure payment by Paystack. We hold the apartment for {policy.holdMinutes} minutes while you pay.
            </p>
          )}
        </div>
      </form>

      <aside className="order-1 overflow-hidden rounded-[2rem] bg-garden text-ivory lg:sticky lg:top-28 lg:order-2">
        <div className="relative h-56 bg-garden-light">
          <Photos photos={apartment.photos} name={apartment.name} sizes="380px" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-garden via-transparent to-transparent" />
          <h3 className="font-display pointer-events-none absolute bottom-4 left-6 right-16 text-3xl">{apartment.name}</h3>
        </div>
        <div className="space-y-5 p-6 text-sm">
          <div className="flex items-start gap-3 text-ivory/85">
            <CalendarDays size={16} className="mt-0.5 shrink-0 text-brass" />
            <div>
              <p>{fmtDate(searched.checkIn)} → {fmtDate(searched.checkOut)}</p>
              <p className="mt-1 text-xs text-ivory/50">Check-in from {policy.checkInTime} · check-out by {policy.checkOutTime}</p>
            </div>
          </div>
          <div className="space-y-2 border-t border-ivory/10 pt-5">
            {quote.nights - weekendNights > 0 && (
              <Row label={`${quote.nights - weekendNights} weeknight${quote.nights - weekendNights === 1 ? '' : 's'}`}
                value={formatGHS(quote.lines.filter((l) => !l.weekend).reduce((s, l) => s + l.rate, 0))} />
            )}
            {weekendNights > 0 && (
              <Row label={`${weekendNights} weekend night${weekendNights === 1 ? '' : 's'}`}
                value={formatGHS(quote.lines.filter((l) => l.weekend).reduce((s, l) => s + l.rate, 0))} />
            )}
            {quote.discount > 0 && <Row label={`Long-stay discount (${quote.discountPct}%)`} value={`− ${formatGHS(quote.discount)}`} accent />}
            <div className="flex items-baseline justify-between border-t border-ivory/10 pt-4">
              <span className="eyebrow text-ivory/60">Total</span>
              <span className="font-display text-3xl">{formatGHS(quote.total)}</span>
            </div>
            {dueNow > 0 && dueNow < quote.total && <Row label="Due now" value={formatGHS(dueNow)} />}
            {dueNow < quote.total && <Row label="Due at check-in" value={formatGHS(quote.total - dueNow)} />}
          </div>
          <ul className="space-y-2 text-ivory/70">
            {apartment.amenities.slice(0, 4).map((am) => (
              <li key={am} className="flex items-center gap-2"><Check size={14} className="text-brass" /> {am}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

// Swipeable-looking photo viewer: arrows on hover, dots, crossfade between an apartment's photos.
function Photos({ photos, name, sizes }: { photos: { url: string; alt: string }[]; name: string; sizes: string }) {
  const [i, setI] = useState(0);
  if (!photos.length) return null;
  const go = (d: number) => (e: React.MouseEvent) => { e.stopPropagation(); setI((n) => (n + d + photos.length) % photos.length); };
  return (
    <div className="group/photos absolute inset-0">
      <AnimatePresence initial={false}>
        <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          <Image src={photos[i].url} alt={photos[i].alt || name} fill className="object-cover" sizes={sizes} />
        </motion.div>
      </AnimatePresence>
      {photos.length > 1 && (
        <>
          <button type="button" onClick={go(-1)} aria-label="Previous photo"
            className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/85 text-garden opacity-0 transition-opacity group-hover/photos:opacity-100 focus:opacity-100">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={go(1)} aria-label="Next photo"
            className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/85 text-garden opacity-0 transition-opacity group-hover/photos:opacity-100 focus:opacity-100">
            <ChevronRight size={16} />
          </button>
          <div className="absolute right-4 top-4 z-10 flex gap-1.5">
            {photos.map((_, n) => (
              <button type="button" key={n} onClick={(e) => { e.stopPropagation(); setI(n); }} aria-label={`Photo ${n + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${n === i ? 'w-6 bg-ivory' : 'w-1.5 bg-ivory/60'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-brass' : 'text-ivory/75'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
