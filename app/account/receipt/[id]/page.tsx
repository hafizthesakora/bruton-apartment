'use client';
import { use, useEffect, useState } from 'react';

type R = {
  id: number; amount: number; method: string | null; reference: string | null; createdAt: string; bookingRef: string;
  checkIn: string; checkOut: string; apartmentName: string; guestName: string; site: { name: string; phone: string; url: string };
};
const METHOD: Record<string, string> = { cash: 'Cash', momo: 'Mobile Money', transfer: 'Bank transfer', card: 'Card', paystack: 'Paystack (online)' };
const ghs = (p: number) => `GH₵ ${(p / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d.length === 10 ? d + 'T00:00:00Z' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Guest's printable payment receipt (signed-in only). */
export default function GuestReceipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [r, setR] = useState<R | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/account/receipt?id=${encodeURIComponent(id)}`)
      .then(async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.error); setR(d); })
      .catch((e) => setError(e.message || 'Receipt not found'));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 print:p-0 print:bg-white">
      <div className="max-w-xl mx-auto px-4">
        {error ? <p className="text-center text-gray-500">{error} — <a href="/account" className="underline">sign in</a></p> : !r ? <p className="text-center text-gray-500">Loading…</p> : (
          <>
            <div className="flex justify-end mb-3 print:hidden">
              <button onClick={() => window.print()} className="bg-lime-400 hover:bg-lime-500 font-semibold px-5 py-2 rounded-lg text-sm">Print / save as PDF</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 print:border-0 text-sm space-y-6">
              <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                <div>
                  <h1 className="text-lg font-semibold">{r.site.name}</h1>
                  <p className="text-gray-500">{r.site.url.replace(/^https?:\/\//, '')}{r.site.phone ? ` · ${r.site.phone}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold uppercase tracking-wide">Receipt</p>
                  <p className="font-mono text-gray-600">RCT-{r.id}</p>
                  <p className="text-gray-500">{day(r.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs uppercase text-gray-400">Received from</p><p className="font-medium">{r.guestName}</p></div>
                <div><p className="text-xs uppercase text-gray-400">Stay</p><p className="font-medium">{r.apartmentName}</p><p>{day(r.checkIn)} → {day(r.checkOut)}</p><p>Booking {r.bookingRef}</p></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-base"><span>Amount received</span><span className="font-semibold">{ghs(r.amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Method</span><span>{METHOD[r.method ?? ''] ?? r.method}</span></div>
                {r.reference && <div className="flex justify-between"><span className="text-gray-500">Reference</span><span>{r.reference}</span></div>}
              </div>
              <p className="text-center text-xs text-gray-400 pt-4">Thank you for staying with {r.site.name}.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
