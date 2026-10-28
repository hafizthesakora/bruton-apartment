'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const iso = (d) => d.toISOString().slice(0, 10);
const plusDays = (s, n) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

// Dates + guests → /book?checkIn&checkOut&guests (BookClient reads these and searches).
export default function AvailabilityBar({ className, dark = false }) {
  const router = useRouter();
  const today = iso(new Date());
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(plusDays(today, 2));
  const [guests, setGuests] = useState(2);

  const submit = (e) => {
    e.preventDefault();
    const qs = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    router.push(`/book?${qs}`);
  };

  const field = cn(
    'flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 md:px-5 md:py-4',
    dark ? 'text-ivory' : 'text-garden'
  );
  const label = cn('eyebrow flex items-center gap-2 text-[0.65rem]', dark ? 'text-sand/80' : 'text-brass');
  const input = 'bg-transparent text-[0.95rem] outline-none [color-scheme:light] w-full min-w-0';

  return (
    <form
      onSubmit={submit}
      className={cn(
        'grid w-full grid-cols-2 overflow-hidden rounded-[1.75rem] border md:flex md:flex-row md:items-stretch md:rounded-full',
        dark ? 'border-ivory/20 bg-garden/60 backdrop-blur-xl' : 'border-white/60 bg-ivory/90 shadow-2xl shadow-black/20 backdrop-blur-xl',
        className
      )}
    >
      <label className={cn(field, 'border-r md:border-r-0', dark ? 'border-ivory/15' : 'border-garden/10')}>
        <span className={label}><CalendarDays size={13} /> Arrive</span>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => {
            setCheckIn(e.target.value);
            if (e.target.value >= checkOut) setCheckOut(plusDays(e.target.value, 1));
          }}
          className={input}
          required
        />
      </label>
      <div className={cn('hidden md:block md:w-px', dark ? 'bg-ivory/15' : 'bg-garden/10')} />
      <label className={field}>
        <span className={label}><CalendarDays size={13} /> Depart</span>
        <input type="date" value={checkOut} min={plusDays(checkIn, 1)} onChange={(e) => setCheckOut(e.target.value)} className={input} required />
      </label>
      <div className={cn('hidden md:block md:w-px', dark ? 'bg-ivory/15' : 'bg-garden/10')} />
      <label className={cn(field, 'border-t md:border-t-0', dark ? 'border-ivory/15' : 'border-garden/10')}>
        <span className={label}><Users size={13} /> Guests</span>
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={cn(input, 'appearance-none')}>
          {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} className="text-ink">{n} {n === 1 ? 'guest' : 'guests'}</option>
          ))}
        </select>
      </label>
      <div className={cn('border-t p-2 md:border-t-0', dark ? 'border-ivory/15' : 'border-garden/10')}>
        <button
          type="submit"
          className="flex h-full min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brass px-8 text-sm font-medium tracking-wide text-white transition-colors duration-500 hover:bg-brass-dark"
        >
          <Search size={16} /> <span className="md:hidden">Search</span><span className="hidden md:inline">Check availability</span>
        </button>
      </div>
    </form>
  );
}
