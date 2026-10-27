'use client';
import { useState } from 'react';
import { Plus, Play, Check, RotateCcw, Ban } from 'lucide-react';
import {
  PageHeader, Button, Card, Field, Input, Select, Textarea, StatusBadge, Badge, Modal, Empty, ErrorText,
  api, useApi, cx, formatDate,
} from '../_components/ui';
import { useCan } from '../_components/StaffContext';

type Priority = 'low' | 'normal' | 'urgent';
type Ticket = {
  id: number; apartmentId: number; apartmentName: string; title: string; description: string; priority: Priority;
  status: 'open' | 'in_progress' | 'resolved'; outOfOrder: boolean; createdAt: string; resolvedAt: string | null; createdBy: string | null;
};
type Data = { tickets: Ticket[]; apartments: { id: number; name: string }[] };
type Result = { warning?: string | null; handedToHousekeeping?: boolean };

const PRIORITY_COLOR: Record<Priority, string> = { urgent: 'red', normal: 'blue', low: 'gray' };
const PRIORITY_OPTIONS = [{ value: 'urgent', label: 'Urgent' }, { value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }];

export default function MaintenancePage() {
  const canEdit = useCan('maintenance', 'full');
  const [showAll, setShowAll] = useState(false);
  const { data, loading, error, reload } = useApi<Data>(`/api/admin/maintenance?status=${showAll ? 'all' : 'open'}`);
  const [creating, setCreating] = useState(false);
  const [resolving, setResolving] = useState<Ticket | null>(null);
  const [notice, setNotice] = useState<{ text: string; warn?: boolean } | null>(null);
  const [err, setErr] = useState('');

  function flash(text: string, warn = false) {
    setNotice({ text, warn });
    setTimeout(() => setNotice(null), warn ? 12_000 : 5000);
  }

  function report(r: Result, okText: string) {
    if (r.warning) flash(r.warning, true);
    else if (r.handedToHousekeeping) flash(`${okText} The apartment is back with housekeeping for a clean.`);
    else flash(okText);
    reload();
  }

  async function patch(json: Record<string, unknown>, okText: string) {
    setErr('');
    try {
      report(await api<Result>('/api/admin/maintenance', { method: 'PATCH', json }), okText);
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    }
  }

  const tickets = data?.tickets ?? [];
  const outOfOrder = new Set(tickets.filter((t) => t.outOfOrder && t.status !== 'resolved').map((t) => t.apartmentName));

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <PageHeader
        title="Maintenance"
        subtitle="Repairs by apartment. Taking a room out of order closes it to bookings until the repair is done."
        actions={canEdit && <Button onClick={() => setCreating(true)}><Plus size={14} /> Report a problem</Button>}
      />

      {notice && <div className={cx('rounded-lg border px-4 py-2.5 text-sm', notice.warn ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-lime-50 border-lime-200 text-lime-800')}>{notice.text}</div>}
      <ErrorText>{err}</ErrorText>

      {outOfOrder.size > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 px-4 py-2.5 text-sm text-purple-800">
          <Ban size={15} /> Out of order: {[...outOfOrder].join(', ')}
        </p>
      )}

      <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm w-fit">
        {([[false, 'Open'], [true, 'All, including resolved']] as const).map(([v, label]) => (
          <button key={label} onClick={() => setShowAll(v)} className={cx('px-3 py-1.5 rounded-md', showAll === v ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>{label}</button>
        ))}
      </div>

      <Card padded={false}>
        {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : tickets.length === 0 ? <Empty>No open repairs. 🎉</Empty> : tickets.map((t) => (
          <div key={t.id} className={cx('flex flex-wrap items-start gap-4 px-6 py-4 border-b border-gray-100 last:border-0 text-sm', t.status === 'resolved' && 'opacity-60')}>
            <div className="flex-1 min-w-[220px] space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">{t.title}</span>
                <Badge color={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
                <StatusBadge status={t.status} />
                {t.outOfOrder && t.status !== 'resolved' && <Badge color="purple">out of order</Badge>}
              </div>
              <p className="text-gray-600">{t.apartmentName} · reported {formatDate(t.createdAt, true)}{t.createdBy ? ` by ${t.createdBy}` : ''}{t.resolvedAt ? ` · fixed ${formatDate(t.resolvedAt)}` : ''}</p>
              {t.description && <p className="text-gray-500 whitespace-pre-line">{t.description}</p>}
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-1.5">
                {t.status === 'open' && <Button variant="secondary" className="text-xs" onClick={() => patch({ action: 'start', id: t.id }, 'Marked in progress.')}><Play size={13} /> Start</Button>}
                {t.status !== 'resolved' && !t.outOfOrder && (
                  <Button variant="ghost" className="text-xs" onClick={() => patch({ action: 'edit', id: t.id, outOfOrder: true }, `${t.apartmentName} is out of order.`)}><Ban size={13} /> Out of order</Button>
                )}
                {t.status !== 'resolved' && <Button className="text-xs" onClick={() => setResolving(t)}><Check size={13} /> Fixed</Button>}
                {t.status === 'resolved' && <Button variant="ghost" className="text-xs" onClick={() => patch({ action: 'reopen', id: t.id }, 'Ticket reopened.')}><RotateCcw size={13} /> Reopen</Button>}
              </div>
            )}
          </div>
        ))}
      </Card>

      {creating && data && <NewTicket apartments={data.apartments} onClose={() => setCreating(false)} onDone={(r) => { setCreating(false); report(r, 'Problem reported.'); }} />}
      {resolving && <ResolveTicket ticket={resolving} onClose={() => setResolving(null)}
        onSave={async (cost, note) => { if (await patch({ action: 'resolve', id: resolving.id, cost: cost || undefined, note }, `${resolving.title} — fixed.`)) setResolving(null); }} />}
    </div>
  );
}

function NewTicket({ apartments, onClose, onDone }: { apartments: Data['apartments']; onClose: () => void; onDone: (r: Result) => void }) {
  const [f, setF] = useState({ apartmentId: apartments[0]?.id ?? 0, title: '', description: '', priority: 'normal' as Priority, outOfOrder: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setBusy(true);
    setErr('');
    try {
      onDone(await api<Result>('/api/admin/maintenance', { method: 'POST', json: f }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Report a problem">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Apartment"><Select value={f.apartmentId} options={apartments.map((a) => ({ value: a.id, label: a.name }))} onChange={(e) => setF({ ...f, apartmentId: Number(e.target.value) })} /></Field>
          <Field label="Priority"><Select value={f.priority} options={PRIORITY_OPTIONS} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })} /></Field>
        </div>
        <Field label="What’s wrong?"><Input placeholder="e.g. Bathroom tap leaking" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus /></Field>
        <Field label="Details" hint="optional"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <label className="flex items-start gap-2">
          <input type="checkbox" className="accent-purple-600 mt-0.5" checked={f.outOfOrder} onChange={(e) => setF({ ...f, outOfOrder: e.target.checked })} />
          <span>Take the apartment out of order <span className="text-gray-500">— guests can’t stay or book it until this is fixed</span></span>
        </label>
        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!f.title.trim()} onClick={save}>Report</Button>
        </div>
      </div>
    </Modal>
  );
}

function ResolveTicket({ ticket, onClose, onSave }: { ticket: Ticket; onClose: () => void; onSave: (cost: string, note: string) => Promise<void> }) {
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={`Fixed — ${ticket.title}`}>
      <div className="space-y-3 text-sm">
        <Field label="What was done?" hint="optional"><Input value={note} onChange={(e) => setNote(e.target.value)} autoFocus /></Field>
        <Field label="Repair cost (GH₵)" hint="optional — recorded as an expense"><Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
        {ticket.outOfOrder && <p className="text-gray-500">If this was the last repair keeping {ticket.apartmentName} out of order, it goes back to housekeeping as dirty with a clean on today’s list.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={async () => { setBusy(true); await onSave(cost, note); setBusy(false); }}>Mark fixed</Button>
        </div>
      </div>
    </Modal>
  );
}
