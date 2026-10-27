'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { PageHeader, Card, Input, Empty, Table, Td, Badge, useApi, formatGHS, formatDate } from '../_components/ui';

type Guest = { id: number; fullName: string; phone: string | null; email: string | null; nationality: string | null; stays: number; lastStay: string | null; paid: number };
type DupGroup = { match: 'email' | 'phone'; guests: { id: number; fullName: string; phone: string | null; email: string | null }[] };

export default function GuestsPage() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, error } = useApi<{ guests: Guest[]; duplicates: DupGroup[] }>(`/api/admin/guests?mode=list&q=${encodeURIComponent(q)}`);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Guests" subtitle="Everyone who has stayed or booked — contacts, ID, stay history and notes." />

      {data && data.duplicates.length > 0 && (
        <Card title={<span className="flex items-center gap-2"><Users size={16} /> Possible duplicates · {data.duplicates.length}</span>}>
          <p className="text-sm text-gray-500 mb-3">These records share an email or phone number. Open one to merge the others into it.</p>
          <div className="space-y-2">
            {data.duplicates.map((d, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge color="amber">same {d.match}</Badge>
                {d.guests.map((g, j) => (
                  <span key={g.id} className="flex items-center gap-2">
                    {j > 0 && <span className="text-gray-300">·</span>}
                    <Link href={`/admin/guests/${g.id}`} className="font-medium text-gray-900 hover:underline">{g.fullName}</Link>
                    <span className="text-gray-500">{d.match === 'email' ? g.email : g.phone}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="relative w-80 max-w-full">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input className="pl-8" placeholder="Name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card padded={false}>
        {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : !data?.guests.length ? <Empty>No guests found.</Empty> : (
          <Table head={['Guest', 'Contact', 'Stays', 'Last stay', 'Paid']}>
            {data.guests.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/admin/guests/${g.id}`} className="font-medium text-gray-900 hover:underline">{g.fullName}</Link>
                  {g.nationality && <p className="text-xs text-gray-500">{g.nationality}</p>}
                </Td>
                <Td className="text-gray-600">{g.phone && <p>{g.phone}</p>}{g.email && <p className="text-xs">{g.email}</p>}</Td>
                <Td>{g.stays}</Td>
                <Td className="whitespace-nowrap">{g.lastStay ? formatDate(g.lastStay) : '—'}</Td>
                <Td className="whitespace-nowrap">{g.paid ? formatGHS(g.paid) : '—'}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
