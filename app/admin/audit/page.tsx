'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Button, Card, Input, Select, Empty, ErrorText, Table, Td, api, formatDate } from '../_components/ui';

type Entry = { id: number; actorId: number | null; actorName: string; entity: string; entityId: string | null; action: string; diff: unknown; createdAt: string };
type Data = { entries: Entry[]; more: boolean; staff: { id: number; name: string }[]; entities: Record<string, string> };

/** Where a record lives in the admin, so an entry can be opened. */
const LINK: Record<string, (id: string) => string> = {
  booking: (id) => `/admin/folios/${id}`,
  guest: (id) => `/admin/guests/${id}`,
};

const MONEY_KEYS = /amount|total|fee|cost|price|rate|deposit|kept|balance/i;

/** One readable line per changed field; money in cedis, nested objects compacted. */
function summarise(diff: unknown): string[] {
  if (diff == null || typeof diff !== 'object') return diff == null ? [] : [String(diff)];
  return Object.entries(diff as Record<string, unknown>).map(([k, v]) => {
    const label = k.replace(/([A-Z])/g, ' $1').toLowerCase();
    if (typeof v === 'number' && MONEY_KEYS.test(k) && !/pct|nights|days|minutes/i.test(k)) return `${label}: GH₵ ${(v / 100).toFixed(2)}`;
    if (Array.isArray(v)) return `${label}: ${v.join(', ')}`;
    if (v && typeof v === 'object') return `${label}: ${JSON.stringify(v)}`;
    return `${label}: ${v}`;
  });
}

export default function AuditPage() {
  const [filters, setFilters] = useState({ entity: '', actorId: '', from: '', to: '', entityId: '' });
  const [data, setData] = useState<Data | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const qs = (before?: number) => new URLSearchParams(Object.entries({ ...filters, before: before ? String(before) : '' }).filter(([, v]) => v)).toString();

  useEffect(() => {
    let live = true;
    setLoading(true);
    api<Data>(`/api/admin/audit?${qs()}`)
      .then((d) => { if (live) { setData(d); setEntries(d.entries); setErr(''); } })
      .catch((e) => live && setErr((e as Error).message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  async function more() {
    const last = entries[entries.length - 1];
    if (!last) return;
    try {
      const d = await api<Data>(`/api/admin/audit?${qs(last.id)}`);
      setEntries([...entries, ...d.entries]);
      setData(d);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Audit Log" subtitle="Who changed what, and when. Entries can’t be edited or deleted." />

      <div className="flex flex-wrap items-center gap-2">
        <Select className="w-56" value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value, entityId: '' })}
          options={[{ value: '', label: 'Everything' }, ...Object.entries(data?.entities ?? {}).map(([value, label]) => ({ value, label }))]} />
        <Select className="w-44" value={filters.actorId} onChange={(e) => setFilters({ ...filters, actorId: e.target.value })}
          options={[{ value: '', label: 'Anyone' }, ...(data?.staff.map((s) => ({ value: s.id, label: s.name })) ?? [])]} />
        <Input type="date" className="w-40" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <span className="text-gray-400">→</span>
        <Input type="date" className="w-40" value={filters.to} min={filters.from} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        {filters.entityId && (
          <button className="text-xs underline text-gray-600" onClick={() => setFilters({ ...filters, entityId: '' })}>Showing record #{filters.entityId} only — clear</button>
        )}
      </div>
      <ErrorText>{err}</ErrorText>

      <Card padded={false}>
        {loading && !data ? <Empty>Loading…</Empty> : entries.length === 0 ? <Empty>No entries match.</Empty> : (
          <>
            <Table head={['When', 'Who', 'What', 'Record', 'Details']}>
              {entries.map((e) => (
                <tr key={e.id} className="align-top">
                  <Td className="whitespace-nowrap text-gray-500">{formatDate(e.createdAt, true)}</Td>
                  <Td className="whitespace-nowrap">{e.actorName}</Td>
                  <Td className="whitespace-nowrap">
                    <span className="text-gray-500">{data?.entities[e.entity] ?? e.entity}</span>
                    <p className="font-medium text-gray-900">{e.action.replace(/_/g, ' ')}</p>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {e.entityId && (
                      <span className="flex flex-col gap-0.5">
                        {LINK[e.entity] ? <Link href={LINK[e.entity](e.entityId)} className="underline">#{e.entityId}</Link> : <span>#{e.entityId}</span>}
                        <button className="text-xs text-gray-500 underline text-left" onClick={() => setFilters({ ...filters, entity: e.entity, entityId: e.entityId! })}>history</button>
                      </span>
                    )}
                  </Td>
                  <Td className="text-xs text-gray-600">
                    {summarise(e.diff).map((line, i) => <p key={i} className="break-words max-w-md">{line}</p>)}
                  </Td>
                </tr>
              ))}
            </Table>
            {data?.more && <div className="p-4 text-center"><Button variant="secondary" onClick={more}>Load older entries</Button></div>}
          </>
        )}
      </Card>
    </div>
  );
}
