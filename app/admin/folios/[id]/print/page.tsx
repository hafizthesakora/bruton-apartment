'use client';
import { use } from 'react';
import { Printer } from 'lucide-react';
import { Button, Empty, useApi, formatGHS, formatDate } from '../../../_components/ui';
import type { FolioDetail } from '../../types';

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash', momo: 'Mobile Money', transfer: 'Bank transfer', card: 'Card', paystack: 'Paystack (online)', ota: 'Paid on channel',
};

/** Printable invoice (whole bill) or receipt (?receipt=<entry id>). The admin sidebar hides itself when printing. */
export default function PrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ receipt?: string }> }) {
  const { id } = use(params);
  const { receipt } = use(searchParams);
  const { data, error } = useApi<FolioDetail>(`/api/admin/folios/${id}`);

  if (error) return <div className="p-8"><Empty>{error}</Empty></div>;
  if (!data) return <div className="p-8"><Empty>Loading…</Empty></div>;

  const { booking: b, guest: g, entries, totals: t, site } = data;
  const payment = receipt ? entries.find((e) => e.id === Number(receipt) && e.type === 'payment') : null;
  if (receipt && !payment) return <div className="p-8"><Empty>Receipt not found.</Empty></div>;

  return (
    <div className="p-8 print:p-0">
      <div className="flex justify-end mb-4 max-w-2xl mx-auto print:hidden">
        <Button onClick={() => window.print()}><Printer size={14} /> Print / save as PDF</Button>
      </div>

      <div className="bg-white max-w-2xl mx-auto p-10 rounded-xl border border-gray-200 print:border-0 print:rounded-none print:p-0 text-sm text-gray-800">
        <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{site.name}</h1>
            <p className="text-gray-500">{site.url.replace(/^https?:\/\//, '')}{site.phone ? ` · ${site.phone}` : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold uppercase tracking-wide">{payment ? 'Receipt' : 'Invoice'}</p>
            <p className="font-mono text-gray-600">{payment ? `RCT-${payment.id}` : `INV-${b.reference}`}</p>
            <p className="text-gray-500">{formatDate(payment ? payment.createdAt : new Date())}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs uppercase text-gray-400 mb-1">{payment ? 'Received from' : 'Billed to'}</p>
            <p className="font-medium text-gray-900">{g.fullName}</p>
            {g.phone && <p>{g.phone}</p>}
            {g.email && <p>{g.email}</p>}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-400 mb-1">Stay</p>
            <p className="font-medium text-gray-900">{b.apartmentName}</p>
            <p>{formatDate(b.checkIn)} → {formatDate(b.checkOut)} ({b.nights} night{b.nights === 1 ? '' : 's'})</p>
            <p>Booking {b.reference}</p>
          </div>
        </div>

        {payment ? (
          <div className="space-y-2">
            <div className="flex justify-between text-base"><span>Amount received</span><span className="font-semibold">{formatGHS(payment.amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Method</span><span>{METHOD_LABEL[payment.method ?? ''] ?? payment.method}</span></div>
            {payment.reference && <div className="flex justify-between"><span className="text-gray-500">Reference</span><span>{payment.reference}</span></div>}
            {payment.staffName && <div className="flex justify-between"><span className="text-gray-500">Received by</span><span>{payment.staffName}</span></div>}
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-4"><span className="text-gray-500">Balance remaining on booking</span><span>{formatGHS(Math.max(t.balance, 0))}</span></div>
          </div>
        ) : (
          <>
            <table className="w-full mb-6">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-200">
                  <th className="py-2 font-medium">Date</th><th className="py-2 font-medium">Description</th><th className="py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{formatDate(e.createdAt)}</td>
                    <td className="py-2 pr-4">{e.description}{e.reference ? <span className="text-gray-400"> · {e.reference}</span> : null}</td>
                    <td className="py-2 text-right whitespace-nowrap">{e.type === 'payment' ? `−${formatGHS(e.amount)}` : formatGHS(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto w-64 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Total charges</span><span>{formatGHS(t.charges)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Paid</span><span>{formatGHS(t.paid)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-semibold">
                <span>{t.balance < 0 ? 'In credit' : 'Balance due'}</span><span>{formatGHS(Math.abs(t.balance))}</span>
              </div>
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">Thank you for staying with {site.name}.</p>
      </div>
    </div>
  );
}
