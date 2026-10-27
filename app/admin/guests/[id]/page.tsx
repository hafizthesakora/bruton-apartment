'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Search } from 'lucide-react';
import {
  PageHeader, Button, Card, Field, Input, Select, Textarea, StatusBadge, Empty, ErrorText, Table, Td,
  api, useApi, cx, formatGHS, formatDate,
} from '../../_components/ui';
import { useCan } from '../../_components/StaffContext';

type GuestLite = { id: number; fullName: string; phone: string | null; email: string | null };
type Guest = GuestLite & { nationality: string | null; idType: string | null; idNumber: string | null; notes: string; createdAt: string };
type Stay = { id: number; reference: string; status: string; source: string; checkIn: string; checkOut: string; apartmentName: string; balance: number; paid: number };
type Profile =
  | { mergedIntoId: number }
  | { guest: Guest; stays: Stay[]; summary: { stays: number; nights: number; paid: number; owing: number }; possibleDuplicates: GuestLite[] };

const ID_TYPES = ['', 'Ghana Card', 'Passport', 'Driver’s licence', 'Voter ID', 'Other'].map((v) => ({ value: v, label: v || '—' }));
const SOURCE_LABEL: Record<string, string> = {
  direct: 'Website', phone: 'Phone', walk_in: 'Walk-in', airbnb: 'Airbnb', booking_com: 'Booking.com', vrbo: 'Vrbo', expedia: 'Expedia',
};
const masked = (s: string) => (s.length > 4 ? '•'.repeat(s.length - 4) + s.slice(-4) : s);

export default function GuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, error, reload } = useApi<Profile>(`/api/admin/guests/${id}`);
  const canEdit = useCan('guests', 'full');

  // An old link to a merged-away record goes to the guest it was merged into.
  useEffect(() => {
    if (data && 'mergedIntoId' in data) router.replace(`/admin/guests/${data.mergedIntoId}`);
  }, [data, router]);

  if (loading && !data) return <div className="p-8"><Empty>Loading…</Empty></div>;
  if (error || !data) return <div className="p-8"><Empty>{error || 'Not found'}</Empty></div>;
  if ('mergedIntoId' in data) return <div className="p-8"><Empty>This record was merged — opening the kept guest…</Empty></div>;

  const { guest: g, stays, summary: s, possibleDuplicates } = data;

  return (
    <div className="p-8 space-y-6">
      <Link href="/admin/guests" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft size={14} /> All guests</Link>
      <PageHeader title={g.fullName} subtitle={`Guest since ${formatDate(g.createdAt)}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Stays" value={String(s.stays)} />
        <Stat label="Nights" value={String(s.nights)} />
        <Stat label="Paid in total" value={formatGHS(s.paid)} />
        <Stat label="Owing" value={formatGHS(s.owing)} warn={s.owing > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title={`Stays · ${stays.length}`} padded={false}>
            {stays.length === 0 ? <Empty>No bookings yet.</Empty> : (
              <Table head={['Booking', 'Apartment', 'Dates', 'Via', 'Status', 'Balance']}>
                {stays.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <Td><Link href={`/admin/folios/${b.id}`} className="font-mono text-xs hover:underline">{b.reference}</Link></Td>
                    <Td className="whitespace-nowrap">{b.apartmentName}</Td>
                    <Td className="whitespace-nowrap">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</Td>
                    <Td className="text-gray-500">{SOURCE_LABEL[b.source] ?? b.source}</Td>
                    <Td><StatusBadge status={b.status} /></Td>
                    <Td className={cx('whitespace-nowrap', b.balance > 0 ? 'text-amber-700 font-semibold' : 'text-gray-500')}>{b.balance > 0 ? formatGHS(b.balance) : 'Settled'}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
          {canEdit && <MergePanel guest={g} suggestions={possibleDuplicates} onDone={reload} />}
        </div>

        <GuestDetails key={JSON.stringify(g)} guest={g} canEdit={canEdit} onSaved={reload} />
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={cx('rounded-xl border p-4', warn ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200')}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cx('text-xl font-semibold mt-1', warn ? 'text-amber-700' : 'text-gray-900')}>{value}</p>
    </div>
  );
}

/* ── Details (view / edit) ─────────────────────────────────────────────── */

function GuestDetails({ guest: g, canEdit, onSaved }: { guest: Guest; canEdit: boolean; onSaved: () => void }) {
  const initial = { fullName: g.fullName, phone: g.phone ?? '', email: g.email ?? '', nationality: g.nationality ?? '', idType: g.idType ?? '', idNumber: g.idNumber ?? '', notes: g.notes };
  const [f, setF] = useState(initial);
  const [showId, setShowId] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  async function save() {
    setBusy(true);
    setErr('');
    setOk(false);
    try {
      await api(`/api/admin/guests/${g.id}`, { method: 'PATCH', json: f });
      setOk(true);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Details">
      <div className="space-y-3 text-sm">
        <Field label="Full name"><Input value={f.fullName} disabled={!canEdit} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
        <Field label="Phone"><Input value={f.phone} disabled={!canEdit} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={f.email} disabled={!canEdit} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Nationality"><Input value={f.nationality} disabled={!canEdit} onChange={(e) => setF({ ...f, nationality: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ID type"><Select value={f.idType} disabled={!canEdit} options={ID_TYPES} onChange={(e) => setF({ ...f, idType: e.target.value })} /></Field>
          <Field label="ID number">
            <div className="relative">
              <Input value={showId ? f.idNumber : masked(f.idNumber)} disabled={!canEdit || !showId} onChange={(e) => setF({ ...f, idNumber: e.target.value })} className="pr-9" />
              <button type="button" onClick={() => setShowId(!showId)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label={showId ? 'Hide ID number' : 'Show ID number'}>
                {showId ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
        </div>
        <Field label="Notes" hint="preferences, allergies, anything staff should know"><Textarea rows={4} value={f.notes} disabled={!canEdit} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <ErrorText>{err}</ErrorText>
        {ok && !dirty && <p className="text-lime-700">Saved.</p>}
        {canEdit && <Button loading={busy} disabled={!dirty} onClick={save}>Save details</Button>}
      </div>
    </Card>
  );
}

/* ── Merge ─────────────────────────────────────────────────────────────── */

function MergePanel({ guest, suggestions, onDone }: { guest: Guest; suggestions: GuestLite[]; onDone: () => void }) {
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<GuestLite[]>([]);
  const [pick, setPick] = useState<GuestLite | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (search.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => {
      api<GuestLite[]>(`/api/admin/guests?q=${encodeURIComponent(search)}`).then((r) => setHits(r.filter((h) => h.id !== guest.id))).catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search, guest.id]);

  async function merge() {
    if (!pick) return;
    setBusy(true);
    setErr('');
    try {
      const r = await api<{ bookingsMoved: number }>(`/api/admin/guests/${guest.id}`, { method: 'POST', json: { mergeId: pick.id } });
      setOk(`${pick.fullName} merged in — ${r.bookingsMoved} booking${r.bookingsMoved === 1 ? '' : 's'} moved.`);
      setPick(null);
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const describe = (g: GuestLite) => [g.phone, g.email].filter(Boolean).join(' · ');

  return (
    <Card title="Merge a duplicate into this guest">
      <div className="space-y-3 text-sm">
        <p className="text-gray-500">Their bookings move to {guest.fullName}, and any details missing here are copied across. This can’t be undone.</p>
        {suggestions.length > 0 && !pick && (
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-600">Likely the same person:</span>
            {suggestions.map((s) => (
              <button key={s.id} onClick={() => setPick(s)} className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100">
                {s.fullName} <span className="text-amber-600">{describe(s)}</span>
              </button>
            ))}
          </div>
        )}
        {pick ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <span>Merge <b>{pick.fullName}</b> {describe(pick) && <span className="text-gray-600">({describe(pick)})</span>} into <b>{guest.fullName}</b>?</span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPick(null)}>Cancel</Button>
              <Button loading={busy} onClick={merge}>Merge</Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input className="pl-8" placeholder="Find another guest record by name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            {hits.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                {hits.map((h) => (
                  <button key={h.id} className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setPick(h); setSearch(''); setHits([]); }}>
                    <span className="font-medium">{h.fullName}</span> <span className="text-gray-500">{describe(h)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <ErrorText>{err}</ErrorText>
        {ok && <p className="text-lime-700">{ok}</p>}
      </div>
    </Card>
  );
}
