'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Phone, KeyRound, IdCard, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import {
  PageHeader, Button, Card, Field, Input, Select, Textarea, StatusBadge, Badge, Modal, Empty, ErrorText,
  api, useApi, cx, formatGHS, formatDate,
} from '../_components/ui';
import { useCan } from '../_components/StaffContext';

/* ── Types & helpers ───────────────────────────────────────────────────── */

type Row = {
  id: number; reference: string; status: string; source: string; checkIn: string; checkOut: string;
  adults: number; children: number; notes: string; idCaptured: boolean; keyIssued: boolean; keyReturned: boolean;
  securityDeposit: number; securityDepositReturned: number | null; checkedInAt: string | null; checkedOutAt: string | null;
  apartmentId: number; apartmentName: string; hkStatus: string | null;
  guestName: string; guestPhone: string | null; guestEmail: string | null; idType: string | null; nationality: string | null;
  balance: number;
};
type Day = { date: string; arrivals: Row[]; departures: Row[]; inHouse: Row[]; overdue: Row[]; noShows: Row[] };
type Method = 'cash' | 'momo' | 'transfer' | 'card';

const DAY_MS = 86_400_000;
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10); // Accra = UTC

const ID_TYPES = ['Ghana Card', 'Passport', 'Driver’s licence', 'Voter ID', 'Other'].map((v) => ({ value: v, label: v }));
const METHODS: { value: Method; label: string }[] = [
  { value: 'cash', label: 'Cash' }, { value: 'momo', label: 'Mobile Money' }, { value: 'transfer', label: 'Bank transfer' }, { value: 'card', label: 'Card' },
];
const guestsLabel = (r: Row) => `${r.adults} adult${r.adults === 1 ? '' : 's'}${r.children ? `, ${r.children} child${r.children === 1 ? '' : 'ren'}` : ''}`;

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function FrontDeskPage() {
  const canAct = useCan('checkin', 'full');
  const [date, setDate] = useState(today);
  const { data, loading, error, reload } = useApi<Day>(`/api/admin/front-desk?date=${date}`);
  const [action, setAction] = useState<{ kind: 'in' | 'out'; row: Row } | null>(null);
  const [notice, setNotice] = useState('');

  const isToday = date === today();
  const live = canAct && isToday;

  function done(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 6000);
    setAction(null);
    reload();
  }

  const arrivalsLeft = data?.arrivals.filter((r) => r.status === 'confirmed').length ?? 0;
  const departuresLeft = data?.departures.filter((r) => r.status === 'checked_in').length ?? 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Front Desk"
        subtitle={isToday ? 'Today’s arrivals and departures. Check guests in and out here.' : `Viewing ${formatDate(date)} — check-in and check-out only work on today’s list.`}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="secondary" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><ChevronLeft size={16} /></Button>
            <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-40" />
            <Button variant="secondary" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRight size={16} /></Button>
            {!isToday && <Button variant="secondary" onClick={() => setDate(today())}>Today</Button>}
          </div>
        }
      />

      {notice && <div className="mb-4 rounded-lg bg-lime-50 border border-lime-200 px-4 py-2.5 text-sm text-lime-800">{notice}</div>}

      {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Arrivals to check in" value={arrivalsLeft} of={data.arrivals.length} />
            <Stat label="Departures to check out" value={departuresLeft} of={data.departures.length} />
            <Stat label="Staying over" value={data.inHouse.length} />
            <Stat label="Needs attention" value={data.overdue.length + data.noShows.length} alert />
          </div>

          {(data.overdue.length > 0 || data.noShows.length > 0) && (
            <Card title={<span className="flex items-center gap-2 text-red-700"><AlertTriangle size={16} /> Needs attention</span>} padded={false}>
              {data.overdue.map((r) => (
                <GuestRow key={r.id} row={r} note={`Was due out ${formatDate(r.checkOut)}`}
                  action={live && <Button variant="secondary" onClick={() => setAction({ kind: 'out', row: r })}><LogOut size={14} /> Check out</Button>} />
              ))}
              {data.noShows.map((r) => (
                <GuestRow key={r.id} row={r} note={`Due in ${formatDate(r.checkIn)} — not arrived`}
                  action={
                    <div className="flex gap-2">
                      {live && <Button variant="secondary" onClick={() => setAction({ kind: 'in', row: r })}><LogIn size={14} /> Check in</Button>}
                      <Link href="/admin/calendar" className="text-xs text-gray-500 underline self-center">Cancel on calendar</Link>
                    </div>
                  } />
              ))}
            </Card>
          )}

          <Card title={`Arrivals · ${data.arrivals.length}`} padded={false}>
            {data.arrivals.length === 0 ? <Empty>No arrivals {isToday ? 'today' : 'on this day'}.</Empty> : data.arrivals.map((r) => (
              <GuestRow key={r.id} row={r}
                action={r.status === 'checked_out'
                  ? <Badge color="gray">Left at {formatTime(r.checkedOutAt)}</Badge>
                  : r.status === 'checked_in'
                  ? <Badge color="green">In at {formatTime(r.checkedInAt)}</Badge>
                  : live && <Button onClick={() => setAction({ kind: 'in', row: r })}><LogIn size={14} /> Check in</Button>} />
            ))}
          </Card>

          <Card title={`Departures · ${data.departures.length}`} padded={false}>
            {data.departures.length === 0 ? <Empty>No departures {isToday ? 'today' : 'on this day'}.</Empty> : data.departures.map((r) => (
              <GuestRow key={r.id} row={r}
                action={r.status === 'checked_out'
                  ? <Badge color="gray">Out at {formatTime(r.checkedOutAt)}</Badge>
                  : live && <Button onClick={() => setAction({ kind: 'out', row: r })}><LogOut size={14} /> Check out</Button>} />
            ))}
          </Card>

          <Card title={`Staying over · ${data.inHouse.length}`} padded={false}>
            {data.inHouse.length === 0 ? <Empty>Nobody staying over.</Empty> : data.inHouse.map((r) => (
              <GuestRow key={r.id} row={r} note={`Leaves ${formatDate(r.checkOut)}`}
                action={live && <Button variant="ghost" onClick={() => setAction({ kind: 'out', row: r })}>Leaving early?</Button>} />
            ))}
          </Card>
        </div>
      )}

      {action?.kind === 'in' && <CheckInModal row={action.row} onClose={() => setAction(null)} onDone={done} />}
      {action?.kind === 'out' && <CheckOutModal row={action.row} onClose={() => setAction(null)} onDone={done} />}
    </div>
  );
}

function formatTime(ts: string | null) {
  return ts ? new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';
}

function Stat({ label, value, of, alert }: { label: string; value: number; of?: number; alert?: boolean }) {
  return (
    <div className={cx('rounded-xl border p-4', alert && value > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200')}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cx('text-2xl font-semibold mt-1', alert && value > 0 ? 'text-red-700' : 'text-gray-900')}>
        {value}{of != null && of !== value && <span className="text-sm font-normal text-gray-400"> / {of}</span>}
      </p>
    </div>
  );
}

function GuestRow({ row: r, note, action }: { row: Row; note?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 border-b border-gray-100 last:border-0 text-sm">
      <div className="min-w-[180px]">
        <p className="font-medium text-gray-900">{r.guestName}</p>
        <p className="text-xs text-gray-500">{r.reference} · {guestsLabel(r)}</p>
        {r.guestPhone && <a href={`tel:${r.guestPhone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"><Phone size={11} /> {r.guestPhone}</a>}
      </div>
      <div className="min-w-[150px]">
        <p className="text-gray-900">{r.apartmentName}</p>
        <p className="text-xs text-gray-500">{formatDate(r.checkIn)} → {formatDate(r.checkOut)}</p>
        {r.hkStatus && r.hkStatus !== 'clean' && r.status === 'confirmed' && (
          <span className="mt-0.5 inline-block"><StatusBadge status={r.hkStatus} /></span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className={cx('flex items-center gap-1', r.idCaptured ? 'text-lime-700' : 'text-gray-400')} title={r.idCaptured ? `ID: ${r.idType ?? 'recorded'}` : 'No ID recorded'}><IdCard size={14} /> ID</span>
        <span className={cx('flex items-center gap-1', r.keyIssued && !r.keyReturned ? 'text-lime-700' : 'text-gray-400')}
          title={r.keyReturned ? 'Key returned' : r.keyIssued ? 'Key issued' : 'No key issued'}><KeyRound size={14} /> {r.keyReturned ? 'Returned' : 'Key'}</span>
        {r.securityDeposit > 0 && <span>Deposit {formatGHS(r.securityDeposit)}</span>}
      </div>
      <div className="min-w-[110px]">
        <p className="text-xs text-gray-500">Balance</p>
        <Link href={`/admin/folios/${r.id}`} className={cx('font-semibold hover:underline', r.balance > 0 ? 'text-amber-700' : 'text-lime-700')}>{r.balance > 0 ? formatGHS(r.balance) : 'Paid'}</Link>
      </div>
      {note && <p className="text-xs text-red-600">{note}</p>}
      <div className="ml-auto">{action}</div>
      {r.notes && <p className="basis-full text-xs text-gray-500 whitespace-pre-line">{r.notes}</p>}
    </div>
  );
}

/* ── Payment fields (shared) ───────────────────────────────────────────── */

type Pay = { amount: string; method: Method; reference: string };

function PaymentFields({ pay, setPay, balance }: { pay: Pay; setPay: (p: Pay) => void; balance: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Take payment</h4>
        <span className={cx('font-semibold', balance > 0 ? 'text-amber-700' : 'text-lime-700')}>{balance > 0 ? `${formatGHS(balance)} owing` : 'Fully paid'}</span>
      </div>
      {balance > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Amount (GH₵)">
            <Input type="number" min="0" step="0.01" placeholder="0" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          </Field>
          <Field label="Method"><Select value={pay.method} options={METHODS} onChange={(e) => setPay({ ...pay, method: e.target.value as Method })} /></Field>
          {pay.method !== 'cash' && <Field label="Reference" hint="MoMo / transfer ID"><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>}
        </div>
      )}
      {balance > 0 && !pay.amount && (
        <button className="text-xs text-gray-600 underline" onClick={() => setPay({ ...pay, amount: String(balance / 100) })}>Fill in full balance</button>
      )}
    </div>
  );
}

const payJson = (p: Pay) => (Number(p.amount) > 0 ? { amount: p.amount, method: p.method, reference: p.reference || undefined } : undefined);

/* ── Check-in ──────────────────────────────────────────────────────────── */

function CheckInModal({ row: r, onClose, onDone }: { row: Row; onClose: () => void; onDone: (msg: string) => void }) {
  const [f, setF] = useState({ idType: r.idType ?? 'Ghana Card', idNumber: '', nationality: r.nationality ?? '', keyIssued: true, securityDeposit: '' });
  const [pay, setPay] = useState<Pay>({ amount: '', method: 'cash', reference: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setBusy(true);
    setErr('');
    try {
      const res = await api<{ warning: string | null }>('/api/admin/front-desk', {
        method: 'POST',
        json: { action: 'check_in', id: r.id, ...f, securityDeposit: f.securityDeposit || 0, payment: payJson(pay) },
      });
      onDone(`${r.guestName} checked in to ${r.apartmentName}.${res.warning ? ` Note: ${res.warning}.` : ''}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Check in · ${r.guestName}`} wide>
      <div className="space-y-4 text-sm">
        <p className="text-gray-600">{r.apartmentName} · {formatDate(r.checkIn)} → {formatDate(r.checkOut)} · {guestsLabel(r)} · {r.reference}</p>
        {r.hkStatus && r.hkStatus !== 'clean' && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">Housekeeping shows this apartment as <b>{r.hkStatus.replace('_', ' ')}</b>.</p>
        )}

        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Guest ID</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="ID type"><Select value={f.idType} options={ID_TYPES} onChange={(e) => setF({ ...f, idType: e.target.value })} /></Field>
            <Field label="ID number"><Input value={f.idNumber} onChange={(e) => setF({ ...f, idNumber: e.target.value })} autoFocus /></Field>
            <Field label="Nationality" hint="optional"><Input value={f.nationality} onChange={(e) => setF({ ...f, nationality: e.target.value })} /></Field>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <label className="flex items-center gap-2 py-2"><input type="checkbox" className="accent-lime-500" checked={f.keyIssued} onChange={(e) => setF({ ...f, keyIssued: e.target.checked })} /> Key handed over</label>
          <Field label="Security deposit held (GH₵)" hint="refundable, not on the bill">
            <Input type="number" min="0" step="0.01" placeholder="0" value={f.securityDeposit} onChange={(e) => setF({ ...f, securityDeposit: e.target.value })} />
          </Field>
        </div>

        <PaymentFields pay={pay} setPay={setPay} balance={r.balance} />

        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!f.idNumber.trim()} onClick={save}><LogIn size={14} /> Check in</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Check-out ─────────────────────────────────────────────────────────── */

function CheckOutModal({ row: r, onClose, onDone }: { row: Row; onClose: () => void; onDone: (msg: string) => void }) {
  const [keyReturned, setKeyReturned] = useState(true);
  const [deposit, setDeposit] = useState(String(r.securityDeposit / 100));
  const [depositNote, setDepositNote] = useState('');
  const [allowBalance, setAllowBalance] = useState(false);
  const [pay, setPay] = useState<Pay>({ amount: '', method: 'cash', reference: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const early = r.checkOut > today();
  const kept = r.securityDeposit - Math.round(Number(deposit || 0) * 100);
  const stillOwing = r.balance - Math.round(Number(pay.amount || 0) * 100);

  async function save() {
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/front-desk', {
        method: 'POST',
        json: {
          action: 'check_out', id: r.id, keyReturned, allowBalance, payment: payJson(pay),
          ...(r.securityDeposit > 0 ? { securityDepositReturned: deposit || 0, depositNote } : {}),
        },
      });
      onDone(`${r.guestName} checked out. ${r.apartmentName} is marked dirty and its clean is on the housekeeping list.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Check out · ${r.guestName}`} wide>
      <div className="space-y-4 text-sm">
        <p className="text-gray-600">{r.apartmentName} · {formatDate(r.checkIn)} → {formatDate(r.checkOut)} · {r.reference}</p>
        {early && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
            Leaving early — the stay will end today and the remaining nights become free. The bill is not changed; adjust it on the folio if you agree a refund.
          </p>
        )}

        <PaymentFields pay={pay} setPay={setPay} balance={r.balance} />
        {stillOwing > 0 && (
          <label className="flex items-center gap-2 text-amber-800">
            <input type="checkbox" className="accent-amber-500" checked={allowBalance} onChange={(e) => setAllowBalance(e.target.checked)} />
            Check out with {formatGHS(stillOwing)} still owing (the manager is alerted)
          </label>
        )}

        <label className="flex items-center gap-2"><input type="checkbox" className="accent-lime-500" checked={keyReturned} onChange={(e) => setKeyReturned(e.target.checked)} /> Key returned</label>

        {r.securityDeposit > 0 && (
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Security deposit · {formatGHS(r.securityDeposit)} held</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Returned to guest (GH₵)"><Input type="number" min="0" max={r.securityDeposit / 100} step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></Field>
              {kept > 0 && <Field label={`Why keep ${formatGHS(kept)}?`}><Textarea rows={2} value={depositNote} onChange={(e) => setDepositNote(e.target.value)} /></Field>}
            </div>
          </div>
        )}

        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={stillOwing > 0 && !allowBalance} onClick={save}><LogOut size={14} /> Check out</Button>
        </div>
      </div>
    </Modal>
  );
}
