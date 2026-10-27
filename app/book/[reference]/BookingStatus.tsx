'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, Loader2, CalendarDays, Home } from 'lucide-react';
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
      <Panel icon={<XCircle size={40} className="text-red-500" />} title="Booking not found">
        <p className="text-gray-600 text-sm">Check the reference and try again, or contact us and we’ll look it up.</p>
        <Actions />
      </Panel>
    );
  }

  if (!booking) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;
  }

  const balance = booking.totalAmount - booking.paid;

  if (booking.status === 'held' || booking.status === 'pending_payment') {
    return (
      <Panel icon={gaveUp ? <Clock size={40} className="text-amber-500" /> : <Loader2 size={40} className="animate-spin text-lime-500" />}
        title={gaveUp ? 'Still waiting for your payment' : 'Confirming your payment…'}>
        <p className="text-gray-600 text-sm">
          {gaveUp
            ? 'If you completed the payment, your booking will be confirmed as soon as Paystack notifies us — you’ll get an email. If you didn’t finish paying, the apartment will be released shortly.'
            : 'This usually takes a few seconds. Mobile Money payments may need you to approve the prompt on your phone.'}
        </p>
        <p className="text-xs text-gray-400 mt-4">Reference {booking.reference}</p>
      </Panel>
    );
  }

  if (booking.status === 'expired' || booking.status === 'cancelled') {
    return (
      <Panel icon={<XCircle size={40} className="text-red-500" />}
        title={booking.status === 'expired' ? 'This booking hold has expired' : 'This booking was cancelled'}>
        <p className="text-gray-600 text-sm">
          {booking.paid > 0
            ? 'We received a payment for this booking — our front desk will contact you shortly to sort it out.'
            : 'No payment was taken. You can search again to make a new booking.'}
        </p>
        <Actions book />
      </Panel>
    );
  }

  return (
    <Panel icon={<CheckCircle2 size={40} className="text-lime-500" />} title={`You’re booked, ${booking.guestFirstName}!`}>
      <p className="text-gray-600 text-sm">We’ve saved your booking. Keep your reference handy for check-in.</p>

      <div className="bg-gray-50 rounded-xl p-5 mt-6 text-left text-sm space-y-3">
        <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-mono font-semibold">{booking.reference}</span></div>
        <div className="flex items-start gap-2">
          <Home size={16} className="mt-0.5 text-lime-600 shrink-0" />
          <span>{booking.apartmentName} · {booking.adults + booking.children} guest{booking.adults + booking.children === 1 ? '' : 's'}</span>
        </div>
        <div className="flex items-start gap-2">
          <CalendarDays size={16} className="mt-0.5 text-lime-600 shrink-0" />
          <span>
            {fmtDate(booking.checkIn)} from {booking.checkInTime}<br />
            to {fmtDate(booking.checkOut)} by {booking.checkOutTime} · {booking.nights} night{booking.nights === 1 ? '' : 's'}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-3 space-y-1">
          <div className="flex justify-between"><span>Total</span><span>{formatGHS(booking.totalAmount)}</span></div>
          {booking.paid > 0 && <div className="flex justify-between text-lime-700"><span>Paid</span><span>{formatGHS(booking.paid)}</span></div>}
          {balance > 0 && <div className="flex justify-between font-semibold"><span>Due at check-in</span><span>{formatGHS(balance)}</span></div>}
        </div>
      </div>
      <Actions />
    </Panel>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      {children}
    </div>
  );
}

function Actions({ book }: { book?: boolean }) {
  return (
    <div className="flex gap-3 mt-6">
      <Link href="/" className="flex-1 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition-colors">Home</Link>
      {book && <Link href="/book" className="flex-1 bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold py-3 rounded-lg transition-colors">Search again</Link>}
    </div>
  );
}
