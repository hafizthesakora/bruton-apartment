'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, LogIn, LogOut, BedDouble, AlertTriangle, Play, Check, RotateCcw, Trash2, Plus } from 'lucide-react';
import {
  PageHeader, Button, Card, Field, Input, Select, StatusBadge, Badge, Modal, Empty, ErrorText,
  api, useApi, cx, formatDate,
} from '../_components/ui';
import { useCan, useStaff } from '../_components/StaffContext';

/* ── Types & helpers ───────────────────────────────────────────────────── */

type HkStatus = 'clean' | 'dirty' | 'in_progress' | 'out_of_order';
type Stay = { reference: string; guestName: string; adults: number; children: number; checkIn: string; checkOut: string; status: string } | null;
type Apt = {
  id: number; name: string; status: HkStatus; note: string | null; updatedAt: string | null; updatedBy: string | null;
  departure: Stay; arrival: Stay; stayover: Stay; urgent: boolean; openTasks: number;
};
type Task = { id: number; apartmentId: number; apartmentName: string; date: string; task: string; assignedTo: number | null; done: boolean; doneAt: string | null; overdue: boolean };
type Board = { date: string; apartments: Apt[]; tasks: Task[]; cleaners: { id: number; name: string; role: string }[]; counts: Record<HkStatus, number> };

const DAY_MS = 86_400_000;
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10); // Accra = UTC

const STATUS_LABEL: Record<HkStatus, string> = { clean: 'Clean', dirty: 'Dirty', in_progress: 'In progress', out_of_order: 'Out of order' };
const STATUS_RING: Record<HkStatus, string> = {
  clean: 'border-lime-300', dirty: 'border-red-300', in_progress: 'border-amber-300', out_of_order: 'border-purple-300',
};
const pax = (s: NonNullable<Stay>) => s.adults + s.children;

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function HousekeepingPage() {
  const staff = useStaff();
  const canEdit = useCan('housekeeping', 'full');
  const [date, setDate] = useState(today);
  const { data, loading, error, reload } = useApi<Board>(`/api/admin/housekeeping?date=${date}`);
  const [mineOnly, setMineOnly] = useState<boolean | null>(null);
  const [statusFor, setStatusFor] = useState<Apt | null>(null);
  const [adding, setAdding] = useState<number | null | undefined>(undefined); // apartment id to preselect; undefined = closed
  const [notice, setNotice] = useState<{ text: string; warn?: boolean } | null>(null);
  const [err, setErr] = useState('');

  // Cleaners land on their own list; managers and front desk see everyone's.
  const showMine = mineOnly ?? staff?.role === 'housekeeping';

  function flash(text: string, warn = false) {
    setNotice({ text, warn });
    setTimeout(() => setNotice(null), warn ? 10_000 : 4000);
  }

  async function post(json: Record<string, unknown>) {
    setErr('');
    try {
      const r = await api<{ warning?: string | null; roomStatus?: HkStatus | null }>('/api/admin/housekeeping', { method: 'POST', json });
      if (r.warning) flash(r.warning, true);
      reload();
      return r;
    } catch (e) {
      setErr((e as Error).message);
      return null;
    }
  }

  async function taskAction(t: Task, action: 'start' | 'done' | 'reopen' | 'delete_task') {
    const r = await post({ action, id: t.id });
    if (r?.roomStatus === 'clean') flash(`${t.apartmentName} is now clean and ready.`);
  }

  const tasks = data?.tasks.filter((t) => !showMine || t.assignedTo === staff?.id || t.assignedTo == null) ?? [];
  const groups = data ? [
    ...data.cleaners.map((c) => ({ id: c.id as number | null, name: c.id === staff?.id ? `${c.name} (you)` : c.name })),
    { id: null, name: 'Unassigned' },
  ].map((g) => ({ ...g, tasks: tasks.filter((t) => t.assignedTo === g.id) }))
    // Tasks assigned to someone who isn't on the cleaner list (e.g. front desk) still show.
    .concat([{ id: -1, name: 'Others', tasks: tasks.filter((t) => t.assignedTo != null && !data.cleaners.some((c) => c.id === t.assignedTo)) }])
    .filter((g) => g.tasks.length > 0) : [];
  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Housekeeping"
        subtitle="Room status and the day’s cleaning list. Finishing a room’s last task marks it clean."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="secondary" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><ChevronLeft size={16} /></Button>
            <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRight size={16} /></Button>
            {date !== today() && <Button variant="secondary" onClick={() => setDate(today())}>Today</Button>}
          </div>
        }
      />

      {notice && (
        <div className={cx('mb-4 rounded-lg border px-4 py-2.5 text-sm', notice.warn ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-lime-50 border-lime-200 text-lime-800')}>{notice.text}</div>
      )}
      <ErrorText>{err}</ErrorText>

      {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(STATUS_LABEL) as HkStatus[]).map((s) => (
              <div key={s} className={cx('rounded-xl border bg-white p-4', STATUS_RING[s])}>
                <p className="text-xs text-gray-500">{STATUS_LABEL[s]}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{data.counts[s]}</p>
              </div>
            ))}
          </div>

          {/* Rooms */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.apartments.map((a) => (
              <div key={a.id} className={cx('bg-white rounded-xl border-2 p-4 space-y-3', STATUS_RING[a.status])}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.name}</h3>
                    {a.updatedAt && <p className="text-xs text-gray-400">{a.updatedBy ? `${a.updatedBy} · ` : ''}{formatDate(a.updatedAt, true)}</p>}
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {a.urgent && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-red-50 text-red-700 px-2.5 py-1.5 text-xs font-medium">
                    <AlertTriangle size={13} /> Guest arriving — needs to be ready
                  </p>
                )}
                {a.note && <p className="text-xs text-gray-600">{a.note}</p>}

                <div className="space-y-1 text-xs text-gray-600">
                  {a.departure && <p className="flex items-center gap-1.5"><LogOut size={13} className="text-gray-400" /> {a.departure.status === 'checked_out' ? 'Left' : 'Leaving'}: {a.departure.guestName}</p>}
                  {a.arrival && <p className="flex items-center gap-1.5"><LogIn size={13} className="text-gray-400" /> Arriving: {a.arrival.guestName} · {pax(a.arrival)} guest{pax(a.arrival) === 1 ? '' : 's'}</p>}
                  {a.stayover && <p className="flex items-center gap-1.5"><BedDouble size={13} className="text-gray-400" /> Staying until {formatDate(a.stayover.checkOut)}</p>}
                  {!a.departure && !a.arrival && !a.stayover && <p className="text-gray-400">Empty</p>}
                  {a.openTasks > 0 && <p className="text-amber-700">{a.openTasks} open task{a.openTasks === 1 ? '' : 's'}</p>}
                </div>

                {canEdit && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="secondary" className="text-xs" onClick={() => setStatusFor(a)}>Change status</Button>
                    <Button variant="ghost" className="text-xs" onClick={() => setAdding(a.id)}><Plus size={13} /> Task</Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tasks */}
          <Card
            title={`Cleaning list · ${openCount} open`}
            actions={
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs">
                  {([[true, 'Mine'], [false, 'Everyone']] as const).map(([v, label]) => (
                    <button key={label} onClick={() => setMineOnly(v)}
                      className={cx('px-2.5 py-1 rounded-md', showMine === v ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>{label}</button>
                  ))}
                </div>
                {canEdit && <Button className="text-xs" onClick={() => setAdding(null)}><Plus size={13} /> Add task</Button>}
              </div>
            }
            padded={false}
          >
            {groups.length === 0 ? <Empty>{showMine ? 'Nothing on your list.' : 'No tasks for this day.'}</Empty> : groups.map((g) => (
              <div key={String(g.id)}>
                <p className="px-6 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{g.name}</p>
                {g.tasks.map((t) => (
                  <div key={t.id} className={cx('flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 last:border-0 text-sm', t.done && 'opacity-60')}>
                    <div className="flex-1 min-w-[200px]">
                      <p className={cx('text-gray-900', t.done && 'line-through')}><b className="font-medium">{t.apartmentName}</b> — {t.task}</p>
                      <p className="text-xs text-gray-500">
                        {t.overdue && <Badge color="red">from {formatDate(t.date)}</Badge>}
                        {t.done && t.doneAt && <span>Done {formatDate(t.doneAt, true)}</span>}
                      </p>
                    </div>
                    {canEdit && !t.done && (
                      <Select className="text-xs w-36" value={t.assignedTo ?? ''}
                        options={[{ value: '', label: 'Unassigned' }, ...data.cleaners.map((c) => ({ value: c.id, label: c.name }))]}
                        onChange={(e) => post({ action: 'assign', id: t.id, assignedTo: e.target.value ? Number(e.target.value) : null })} />
                    )}
                    {canEdit && (
                      <div className="flex gap-1.5">
                        {!t.done && <Button variant="secondary" className="text-xs" onClick={() => taskAction(t, 'start')}><Play size={13} /> Start</Button>}
                        {!t.done && <Button className="text-xs" onClick={() => taskAction(t, 'done')}><Check size={13} /> Done</Button>}
                        {t.done && <Button variant="ghost" className="text-xs" onClick={() => taskAction(t, 'reopen')}><RotateCcw size={13} /> Reopen</Button>}
                        {!t.done && <Button variant="ghost" className="text-xs" onClick={() => taskAction(t, 'delete_task')} aria-label="Delete task"><Trash2 size={13} /></Button>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </div>
      )}

      {statusFor && <StatusModal apt={statusFor} onClose={() => setStatusFor(null)} onSave={async (status, note) => {
        const r = await post({ action: 'status', apartmentId: statusFor.id, status, note });
        if (r) { setStatusFor(null); if (!r.warning) flash(`${statusFor.name} set to ${STATUS_LABEL[status].toLowerCase()}.`); }
      }} />}
      {adding !== undefined && data && <AddTaskModal date={date} apartments={data.apartments} cleaners={data.cleaners} preselect={adding}
        onClose={() => setAdding(undefined)} onSave={async (json) => { if (await post({ action: 'add_task', ...json })) setAdding(undefined); }} />}
    </div>
  );
}

/* ── Modals ────────────────────────────────────────────────────────────── */

function StatusModal({ apt, onClose, onSave }: { apt: Apt; onClose: () => void; onSave: (s: HkStatus, note: string) => Promise<void> }) {
  const [status, setStatus] = useState<HkStatus>(apt.status);
  const [note, setNote] = useState(apt.status === 'out_of_order' ? apt.note ?? '' : '');
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={`${apt.name} — room status`}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(STATUS_LABEL) as HkStatus[]).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cx('rounded-lg border-2 px-3 py-3 font-medium', status === s ? `${STATUS_RING[s]} bg-gray-50` : 'border-gray-200 text-gray-600')}>{STATUS_LABEL[s]}</button>
          ))}
        </div>
        <Field label={status === 'out_of_order' ? 'Why is it out of order?' : 'Note'} hint={status === 'out_of_order' ? 'required — also closes it to online booking' : 'optional'}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={status === 'out_of_order' && !note.trim()} onClick={async () => { setBusy(true); await onSave(status, note); setBusy(false); }}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

function AddTaskModal({ date, apartments, cleaners, preselect, onClose, onSave }: {
  date: string; apartments: Apt[]; cleaners: Board['cleaners']; preselect: number | null;
  onClose: () => void; onSave: (json: Record<string, unknown>) => Promise<void>;
}) {
  const [f, setF] = useState({ apartmentId: preselect ?? apartments[0]?.id ?? 0, task: '', assignedTo: '', date });
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title="Add a task">
      <div className="space-y-3 text-sm">
        <Field label="Apartment"><Select value={f.apartmentId} options={apartments.map((a) => ({ value: a.id, label: a.name }))} onChange={(e) => setF({ ...f, apartmentId: Number(e.target.value) })} /></Field>
        <Field label="Task"><Input placeholder="e.g. Stayover tidy, change linen, restock toiletries" value={f.task} onChange={(e) => setF({ ...f, task: e.target.value })} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assign to"><Select value={f.assignedTo} options={[{ value: '', label: 'Unassigned' }, ...cleaners.map((c) => ({ value: c.id, label: c.name }))]} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} /></Field>
          <Field label="Day"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!f.task.trim()} onClick={async () => {
            setBusy(true);
            await onSave({ apartmentId: f.apartmentId, task: f.task, date: f.date, assignedTo: f.assignedTo ? Number(f.assignedTo) : null });
            setBusy(false);
          }}>Add task</Button>
        </div>
      </div>
    </Modal>
  );
}
