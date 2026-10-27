'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { PageHeader, Card, Input, StatusBadge, Empty, Table, Td, useApi, cx, formatGHS, formatDate } from '../_components/ui';

type Folio = {
  id: number; reference: string; status: string; checkIn: string; checkOut: string;
  guestName: string; guestPhone: string | null; apartmentName: string; charges: number; paid: number; balance: number;
};

export default function FoliosPage() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [owing, setOwing] = useState(true);
  const { data, loading, error } = useApi<Folio[]>(`/api/admin/folios?${new URLSearchParams({ q, owing: owing ? '1' : '0' })}`);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const totalOwing = data?.reduce((s, f) => s + Math.max(f.balance, 0), 0) ?? 0;

  return (
    <div className="p-8">
      <PageHeader title="Folios & Payments" subtitle="Every booking’s bill: charges, payments, refunds and what is still owing." />

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative w-80 max-w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-8" placeholder="Guest name, phone or booking reference" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
          {([[true, 'Owing'], [false, 'All bills']] as const).map(([v, label]) => (
            <button key={label} onClick={() => setOwing(v)}
              className={cx('px-3 py-1.5 rounded-md', owing === v ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>{label}</button>
          ))}
        </div>
        {owing && data && data.length > 0 && <p className="text-sm text-gray-600">Total owing: <b className="text-amber-700">{formatGHS(totalOwing)}</b></p>}
      </div>

      <Card padded={false}>
        {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : !data?.length ? (
          <Empty>{owing ? 'Nothing owing — every bill is settled.' : 'No bills found.'}</Empty>
        ) : (
          <Table head={['Guest', 'Booking', 'Stay', 'Status', 'Bill', 'Paid', 'Balance']}>
            {data.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/admin/folios/${f.id}`} className="font-medium text-gray-900 hover:underline">{f.guestName}</Link>
                  {f.guestPhone && <p className="text-xs text-gray-500">{f.guestPhone}</p>}
                </Td>
                <Td><Link href={`/admin/folios/${f.id}`} className="font-mono text-xs hover:underline">{f.reference}</Link></Td>
                <Td><span className="whitespace-nowrap">{f.apartmentName}</span><p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(f.checkIn)} → {formatDate(f.checkOut)}</p></Td>
                <Td><StatusBadge status={f.status} /></Td>
                <Td className="whitespace-nowrap">{formatGHS(f.charges)}</Td>
                <Td className="whitespace-nowrap text-lime-700">{formatGHS(f.paid)}</Td>
                <Td className={cx('whitespace-nowrap font-semibold', f.balance > 0 ? 'text-amber-700' : f.balance < 0 ? 'text-blue-700' : 'text-gray-500')}>
                  {f.balance < 0 ? `${formatGHS(-f.balance)} credit` : formatGHS(f.balance)}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
