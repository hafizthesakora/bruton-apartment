'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, XCircle, Loader2, CalendarDays, Home } from 'lucide-react';
import { formatGHS } from '@/lib/money';

type Booking = {
  reference: string;
  status: 'held' | 'pending_payment' | 'confirmed' | 'checked_in' | 'checked_out' | 'expired' | 'cancelled';
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  paymentMode: 'full' | 'deposit' | 'pay_on_arrival';
  totalAmount: number;
  paid: number;
  apartmentName: string;
  guestFirstName: string;
  checkInTime: string;
  checkOutTime: string;
};

const POLL_MS = 3000;
const POLL_FOR_MS = 3 * 60_000;

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Paystack sends the guest back here. We never trust the redirect itself — we poll
 * until the webhook has confirmed the booking.
 */
export default function BookingStatus({ reference }: { reference: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();

    const load = async () => {
      try {
        const res = await fetch(`/api/booking/${reference}`, { cache: 'no-store' });
        if (res.status === 404) return setNotFound(true);
        const data: Booking = await res.json();
        if (stop) return;
        setBooking(data);
        const waiting = data.status === 'held' || data.status === 'pending_payment';
        if (!waiting) return;
        if (Date.now() - started > POLL_FOR_MS) return setGaveUp(true);
      } catch {
        // network blip — try again
      }
      timer = setTimeout(load, POLL_MS);
    };
    load();
    return () => { stop = true; clearTimeout(timer); };
  }, [reference]);

  if (notFound) {
    return (
      <Panel icon={<XCircle size={44} strokeWidth={1.25} className="text-red-700" />} title="Booking not found">
        <p className="text-ink/60">Check the reference and try again, or contact us and we’ll look it up.</p>
        <Actions />
      </Panel>
    );
  }

  if (!booking) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-brass" size={32} /></div>;
  }

  const balance = booking.totalAmount - booking.paid;

  if (booking.status === 'held' || booking.status === 'pending_payment') {
    return (
      <Panel icon={gaveUp ? <Clock size={44} strokeWidth={1.25} className="text-brass" /> : <Loader2 size={44} strokeWidth={1.25} className="animate-spin text-brass" />}
        title={gaveUp ? 'Still waiting for your payment' : 'Confirming your payment…'}>
        <p className="text-ink/60">
          {gaveUp
            ? 'If you completed the payment, your booking will be confirmed as soon as Paystack notifies us — you’ll get an email. If you didn’t finish paying, the apartment will be released shortly.'
            : 'This usually takes a few seconds. Mobile Money payments may need you to approve the prompt on your phone.'}
        </p>
        <p className="eyebrow mt-6 text-ink/40">Reference {booking.reference}</p>
      </Panel>
    );
  }

  if (booking.status === 'expired' || booking.status === 'cancelled') {
    return (
      <Panel icon={<XCircle size={44} strokeWidth={1.25} className="text-red-700" />}
        title={booking.status === 'expired' ? 'This booking hold has expired' : 'This booking was cancelled'}>
        <p className="text-ink/60">
          {booking.paid > 0
            ? 'We received a payment for this booking — our front desk will contact you shortly to sort it out.'
            : 'No payment was taken. You can search again to make a new booking.'}
        </p>
        <Actions book />
      </Panel>
    );
  }

  return (
    <Panel icon={<SuccessMark />} title={`You’re booked, ${booking.guestFirstName}!`}>
      <p className="text-ink/60">We’ve saved your booking. Keep your reference handy for check-in.</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 space-y-4 rounded-[1.5rem] bg-garden p-6 text-left text-sm text-ivory/85 md:p-8"
      >
        <div className="flex items-baseline justify-between"><span className="eyebrow text-ivory/50">Reference</span><span className="font-mono text-lg tracking-wider text-ivory">{booking.reference}</span></div>
        <div className="flex items-start gap-2">
          <Home size={16} className="mt-0.5 shrink-0 text-brass" />
          <span>{booking.apartmentName} · {booking.adults + booking.children} guest{booking.adults + booking.children === 1 ? '' : 's'}</span>
        </div>
        <div className="flex items-start gap-2">
          <CalendarDays size={16} className="mt-0.5 shrink-0 text-brass" />
          <span>
            {fmtDate(booking.checkIn)} from {booking.checkInTime}<br />
            to {fmtDate(booking.checkOut)} by {booking.checkOutTime} · {booking.nights} night{booking.nights === 1 ? '' : 's'}
          </span>
        </div>
        <div className="space-y-1.5 border-t border-ivory/10 pt-4">
          <div className="flex justify-between"><span>Total</span><span>{formatGHS(booking.totalAmount)}</span></div>
          {booking.paid > 0 && <div className="flex justify-between text-brass"><span>Paid</span><span>{formatGHS(booking.paid)}</span></div>}
          {balance > 0 && <div className="flex justify-between font-medium text-ivory"><span>Due at check-in</span><span>{formatGHS(balance)}</span></div>}
        </div>
      </motion.div>
      <Actions />
    </Panel>
  );
}

// Brass ring and tick that draw themselves in.
function SuccessMark() {
  const draw = { hidden: { pathLength: 0 }, show: { pathLength: 1 } };
  return (
    <motion.svg width="88" height="88" viewBox="0 0 88 88" initial="hidden" animate="show" aria-hidden>
      <motion.circle cx="44" cy="44" r="40" fill="none" stroke="#B08D57" strokeWidth="2" variants={draw}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M28 45 L39 56 L61 33" fill="none" stroke="#1F3B2D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        variants={draw} transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }} />
    </motion.svg>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[2rem] border border-garden/10 bg-white/60 p-8 text-center shadow-[0_30px_80px_-40px_rgba(31,59,45,0.4)] backdrop-blur md:p-12"
    >
      <div className="mb-6 flex justify-center">{icon}</div>
      <h1 className="font-display mb-4 text-4xl leading-tight text-garden md:text-5xl">{title}</h1>
      {children}
    </motion.div>
  );
}

function Actions({ book }: { book?: boolean }) {
  return (
    <div className="mt-8 flex gap-3">
      <Link href="/" className="flex-1 rounded-full border border-garden/20 py-3.5 text-sm tracking-wide text-garden transition-colors hover:bg-garden/5">Home</Link>
      <Link href="/account" className="flex-1 rounded-full border border-garden/20 py-3.5 text-sm tracking-wide text-garden transition-colors hover:bg-garden/5">My Booking</Link>
      {book && <Link href="/book" className="flex-1 rounded-full bg-brass py-3.5 text-sm tracking-wide text-white transition-colors hover:bg-brass-dark">Search again</Link>}
    </div>
  );
}
