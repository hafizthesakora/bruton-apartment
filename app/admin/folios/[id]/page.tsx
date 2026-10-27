'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Phone, Mail } from 'lucide-react';
import {
  PageHeader, Button, Card, Field, Input, Select, StatusBadge, Empty, ErrorText, Table, Td,
  api, useApi, cx, formatGHS, formatDate,
} from '../../_components/ui';
import { useCan } from '../../_components/StaffContext';
import type { FolioDetail } from '../types';

type Kind = 'payment' | 'charge' | 'refund' | 'adjustment';

const KINDS: { kind: Kind; label: string; manager?: boolean }[] = [
  { kind: 'payment', label: 'Take payment' },
  { kind: 'charge', label: 'Add charge' },
  { kind: 'refund', label: 'Refund', manager: true },
  { kind: 'adjustment', label: 'Reduce bill', manager: true },
];
const DESK_METHODS = [
  { value: 'cash', label: 'Cash' }, { value: 'momo', label: 'Mobile Money' }, { value: 'transfer', label: 'Bank transfer' }, { value: 'card', label: 'Card' },
];

export default function FolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, reload } = useApi<FolioDetail>(`/api/admin/folios/${id}`);
  const canPost = useCan('payments', 'full');
  const isManager = useCan('refunds', 'full');

  if (loading && !data) return <div className="p-8"><Empty>Loading…</Empty></div>;
  if (error || !data) return <div className="p-8"><Empty>{error || 'Not found'}</Empty></div>;

  const { booking: b, guest: g, entries, totals: t } = data;

  return (
    <div className="p-8 space-y-6">
      <Link href="/admin/folios" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft size={14} /> All folios</Link>
      <PageHeader
        title={`${g.fullName} · ${b.reference}`}
        subtitle={`${b.apartmentName} · ${formatDate(b.checkIn)} → ${formatDate(b.checkOut)} · ${b.nights} night${b.nights === 1 ? '' : 's'}`}
        actions={
          <Link href={`/admin/folios/${b.id}/print`} target="_blank">
            <Button variant="secondary"><Printer size={14} /> Invoice</Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Ledger" padded={false}>
            {entries.length === 0 ? <Empty>No entries yet.</Empty> : (
              <Table head={['Date', 'Description', 'By', 'Charge', 'Paid', '']}>
                {entries.map((e) => {
                  const credit = e.type === 'payment';
                  return (
                    <tr key={e.id}>
                      <Td className="whitespace-nowrap text-gray-500">{formatDate(e.createdAt, true)}</Td>
                      <Td>
                        <span className={cx(e.type === 'refund' && 'text-red-700', e.amount < 0 && 'text-blue-700')}>{e.description}</span>
                        {e.reference && <p className="text-xs text-gray-500">Ref {e.reference}</p>}
                      </Td>
                      <Td className="text-xs text-gray-500 whitespace-nowrap">{e.staffName ?? (e.method === 'paystack' ? 'Online' : '—')}</Td>
                      <Td className="whitespace-nowrap">{!credit ? (e.type === 'refund' ? `+${formatGHS(e.amount)}` : formatGHS(e.amount)) : ''}</Td>
                      <Td className="whitespace-nowrap text-lime-700">{credit ? formatGHS(e.amount) : ''}</Td>
                      <Td>{credit && <Link href={`/admin/folios/${b.id}/print?receipt=${e.id}`} target="_blank" className="text-xs text-gray-500 underline">Receipt</Link>}</Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>

          {canPost && <PostEntry bookingId={b.id} balance={t.balance} paid={t.paid} cancelled={b.status === 'cancelled'} isManager={isManager} onDone={reload} />}
        </div>

        <div className="space-y-6">
          <Card>
            <div className="space-y-2 text-sm">
              <Row label="Charges" value={formatGHS(t.charges)} />
              <Row label="Payments" value={formatGHS(t.payments)} className="text-lime-700" />
              {t.refunds > 0 && <Row label="Refunds" value={formatGHS(t.refunds)} className="text-red-700" />}
              <div className="border-t border-gray-100 pt-2">
                <Row label={t.balance < 0 ? 'In credit' : 'Balance owing'} value={formatGHS(Math.abs(t.balance))}
                  className={cx('text-lg font-semibold', t.balance > 0 ? 'text-amber-700' : t.balance < 0 ? 'text-blue-700' : 'text-gray-900')} />
              </div>
            </div>
          </Card>
          <Card title="Booking">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2"><StatusBadge status={b.status} />{b.channelRef && <span className="text-xs text-gray-500">Channel ref {b.channelRef}</span>}</div>
              <p className="text-gray-600">{b.adults} adult{b.adults === 1 ? '' : 's'}{b.children ? `, ${b.children} child${b.children === 1 ? '' : 'ren'}` : ''}</p>
              {g.phone && <a href={`tel:${g.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"><Phone size={13} /> {g.phone}</a>}
              {g.email && <a href={`mailto:${g.email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"><Mail size={13} /> {g.email}</a>}
              <Link href="/admin/calendar" className="block text-xs text-gray-500 underline pt-1">Open the calendar to change the stay</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return <div className={cx('flex justify-between', className)}><span className="text-gray-500 font-normal text-sm">{label}</span><span>{value}</span></div>;
}

function PostEntry({ bookingId, balance, paid, cancelled, isManager, onDone }: {
  bookingId: number; balance: number; paid: number; cancelled: boolean; isManager: boolean; onDone: () => void;
}) {
  const kinds = KINDS.filter((k) => (!k.manager || isManager) && !(k.kind === 'charge' && cancelled));
  const [kind, setKind] = useState<Kind>(balance > 0 ? 'payment' : 'charge');
  const [f, setF] = useState({ amount: '', method: 'cash', reference: '', description: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function save() {
    setBusy(true);
    setErr('');
    setOk('');
    try {
      const json =
        kind === 'charge' ? { kind, amount: f.amount, description: f.description }
        : kind === 'payment' ? { kind, amount: f.amount, method: f.method, reference: f.reference || undefined }
        : kind === 'refund' ? { kind, amount: f.amount, method: f.method, reference: f.reference || undefined, reason: f.reason }
        : { kind, amount: f.amount, reason: f.reason };
      await api(`/api/admin/folios/${bookingId}`, { method: 'POST', json });
      setOk(kind === 'payment' ? 'Payment recorded — the guest has been sent a receipt.' : 'Saved.');
      setF({ amount: '', method: 'cash', reference: '', description: '', reason: '' });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const methods = kind === 'refund' ? [...DESK_METHODS, { value: 'paystack', label: 'Paystack (refunded in Paystack)' }] : DESK_METHODS;
  const hint = kind === 'payment' && balance > 0 ? `${formatGHS(balance)} owing`
    : kind === 'refund' ? `${formatGHS(paid)} paid`
    : undefined;

  return (
    <Card title={
      <div className="flex flex-wrap gap-1">
        {kinds.map((k) => (
          <button key={k.kind} onClick={() => { setKind(k.kind); setErr(''); setOk(''); }}
            className={cx('px-3 py-1.5 rounded-md text-sm font-medium', kind === k.kind ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100')}>{k.label}</button>
        ))}
      </div>
    }>
      <div className="space-y-3 text-sm">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Amount (GH₵)" hint={hint}><Input type="number" min="0" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          {kind === 'charge' && <div className="sm:col-span-2"><Field label="What for"><Input placeholder="e.g. Airport pickup, laundry, extra night" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>}
          {(kind === 'payment' || kind === 'refund') && (
            <>
              <Field label="Method"><Select value={f.method} options={methods} onChange={(e) => setF({ ...f, method: e.target.value })} /></Field>
              {f.method !== 'cash' && <Field label="Reference" hint="MoMo / transfer ID"><Input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>}
            </>
          )}
          {(kind === 'refund' || kind === 'adjustment') && (
            <div className="sm:col-span-3"><Field label="Reason"><Input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field></div>
          )}
        </div>
        {kind === 'payment' && balance > 0 && !f.amount && (
          <button className="text-xs text-gray-600 underline" onClick={() => setF({ ...f, amount: String(balance / 100) })}>Fill in full balance</button>
        )}
        {kind === 'adjustment' && <p className="text-xs text-gray-500">Lowers the bill, e.g. a discount or a correction. Entries can’t be edited or deleted, so use this to put a mistake right.</p>}
        <ErrorText>{err}</ErrorText>
        {ok && <p className="text-sm text-lime-700">{ok}</p>}
        <Button loading={busy} disabled={!f.amount} onClick={save}>{KINDS.find((k) => k.kind === kind)!.label}</Button>
      </div>
    </Card>
  );
}
