'use client';
import { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, Phone, Mail, Users, UtensilsCrossed } from 'lucide-react';
import {
  PageHeader, Card, Button, Field, Input, Select, Textarea, StatusBadge, Modal, Empty, ErrorText,
  api, useApi, cx, formatGHS, formatDate,
} from '../_components/ui';
import { useCan } from '../_components/StaffContext';
import { EVENT_TYPES } from '@/lib/events/types';

type Stage = 'lead' | 'quoted' | 'deposit_paid' | 'confirmed' | 'lost';
type Lead = {
  id: number;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  eventDate: string;
  eventType: string;
  headcount: number;
  cateringRequired: boolean;
  source: string;
  stage: Stage;
  quoteAmount: number | null;
  depositAmount: number | null;
  quoteNotes: string;
  depositPaidAmount: number;
  depositMethod: string | null;
  depositReference: string | null;
  lostReason: string;
  cateringNotes: string;
  notes: string;
  staffNotes: string;
  clashes: string[];
};

const COLUMNS: { stage: Stage; title: string; hint: string }[] = [
  { stage: 'lead', title: 'New enquiries', hint: 'Send a quote' },
  { stage: 'quoted', title: 'Quoted', hint: 'Waiting for deposit' },
  { stage: 'deposit_paid', title: 'Deposit paid', hint: 'Date held — confirm details' },
  { stage: 'confirmed', title: 'Confirmed', hint: 'On the calendar' },
];
const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }));
const methodOptions = [
  { value: 'momo', label: 'Mobile Money' }, { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Bank transfer' }, { value: 'card', label: 'Card' },
];
const toCedis = (p: number | null | undefined) => (p == null ? '' : String(p / 100));
const shortDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export default function EventsPage() {
  const canEdit = useCan('events', 'full');
  const { data, loading, error, reload } = useApi<Lead[]>('/api/admin/events');
  const [view, setView] = useState<'pipeline' | 'calendar'>('pipeline');
  const [openId, setOpenId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');

  const open = data?.find((l) => l.id === openId) ?? null;
  const lost = data?.filter((l) => l.stage === 'lost') ?? [];

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Events"
        subtitle="Event centre enquiries, quotes, deposits and bookings."
        actions={
          <>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              {(['pipeline', 'calendar'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={cx('px-3 py-1.5 text-sm rounded-md capitalize', view === v ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>
                  {v}
                </button>
              ))}
            </div>
            {canEdit && <Button onClick={() => setAdding(true)}><Plus size={16} /> Add enquiry</Button>}
          </>
        }
      />

      {notice && <div className="mb-4 rounded-lg bg-lime-50 border border-lime-200 px-4 py-2.5 text-sm text-lime-800">{notice}</div>}

      {loading ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : view === 'pipeline' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const items = data?.filter((l) => l.stage === col.stage) ?? [];
              return (
                <div key={col.stage} className="bg-gray-50 rounded-xl border border-gray-200 p-3 min-h-40">
                  <div className="flex items-baseline justify-between px-1 mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">{col.title} <span className="text-gray-400 font-normal">{items.length}</span></h3>
                    <span className="text-xs text-gray-400">{col.hint}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((l) => <LeadCard key={l.id} lead={l} onClick={() => setOpenId(l.id)} />)}
                    {items.length === 0 && <p className="text-xs text-gray-400 px-1 py-4 text-center">Nothing here</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {lost.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-800">Lost / closed ({lost.length})</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 mt-3">
                {lost.map((l) => <LeadCard key={l.id} lead={l} onClick={() => setOpenId(l.id)} />)}
              </div>
            </details>
          )}
        </>
      ) : (
        <EventCalendar leads={data ?? []} onOpen={setOpenId} />
      )}

      {open && (
        <LeadModal
          lead={open}
          canEdit={canEdit}
          onClose={() => setOpenId(null)}
          onDone={(msg) => { flash(msg); reload(); }}
        />
      )}

      {adding && <AddLeadModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); flash('Enquiry added.'); reload(); }} />}
    </div>
  );
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-lg border border-gray-200 hover:border-lime-400 p-3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900 text-sm">{lead.eventType}</p>
        {lead.clashes.length > 0 && <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" aria-label="Date clash" />}
      </div>
      <p className="text-xs text-gray-600 mt-0.5">{shortDate(lead.eventDate)} · {lead.headcount} guests</p>
      <p className="text-xs text-gray-500 mt-1">{lead.name}</p>
      {lead.quoteAmount != null && (
        <p className="text-xs text-gray-700 mt-1.5">
          {formatGHS(lead.quoteAmount)}
          {lead.depositPaidAmount > 0 && <span className="text-lime-700"> · paid {formatGHS(lead.depositPaidAmount)}</span>}
        </p>
      )}
    </button>
  );
}

function EventCalendar({ leads, onOpen }: { leads: Lead[]; onOpen: (id: number) => void }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const days = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [cursor]);
  const key = (day: number) => `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const live = leads.filter((l) => l.stage !== 'lost');

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-1.5 rounded hover:bg-gray-100" aria-label="Previous month"><ChevronLeft size={18} /></button>
        <h3 className="font-semibold">{cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-1.5 rounded hover:bg-gray-100" aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 text-xs text-gray-500 border-b border-gray-100">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="px-2 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => (
          <div key={i} className="min-h-24 border-b border-r border-gray-100 p-1.5">
            {day && <p className="text-xs text-gray-400 mb-1">{day}</p>}
            {day && live.filter((l) => l.eventDate === key(day)).map((l) => {
              const booked = l.stage === 'deposit_paid' || l.stage === 'confirmed';
              return (
                <button key={l.id} onClick={() => onOpen(l.id)}
                  className={cx('block w-full truncate text-left text-[11px] rounded px-1.5 py-0.5 mb-1',
                    booked ? 'bg-lime-400 text-slate-900 font-medium' : 'bg-gray-100 text-gray-600 border border-dashed border-gray-300')}>
                  {l.eventType} · {l.headcount}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="px-6 py-3 text-xs text-gray-500">Solid = date held (deposit paid or confirmed). Dashed = enquiry or quote, date not held.</p>
    </Card>
  );
}

function LeadModal({ lead, canEdit, onClose, onDone }: { lead: Lead; canEdit: boolean; onClose: () => void; onDone: (msg: string) => void }) {
  const [quote, setQuote] = useState({ quoteAmount: toCedis(lead.quoteAmount), depositAmount: toCedis(lead.depositAmount), quoteNotes: lead.quoteNotes });
  const [payment, setPayment] = useState({ amount: lead.stage === 'quoted' ? toCedis(lead.depositAmount) : '', method: 'momo', reference: '' });
  const [details, setDetails] = useState({
    eventDate: lead.eventDate, eventType: lead.eventType, headcount: String(lead.headcount),
    cateringNotes: lead.cateringNotes, staffNotes: lead.staffNotes,
  });
  const [lostReason, setLostReason] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function act(action: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(action);
    setErr('');
    try {
      const res = await api<{ messaged: boolean }>('/api/admin/events', { method: 'PATCH', json: { action, id: lead.id, ...body } });
      onDone(res.messaged ? `${okMsg} The client has been sent an email and SMS.` : okMsg);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  const balance = (lead.quoteAmount ?? 0) - lead.depositPaidAmount;
  const canQuote = lead.stage === 'lead' || lead.stage === 'quoted';
  const canPay = ['quoted', 'deposit_paid', 'confirmed'].includes(lead.stage);
  const canConfirm = lead.stage === 'quoted' || lead.stage === 'deposit_paid';

  return (
    <Modal open onClose={onClose} title={`${lead.eventType} · ${lead.reference}`} wide>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <StatusBadge status={lead.stage} />
          <span className="text-gray-700">{formatDate(lead.eventDate)}</span>
          <span className="flex items-center gap-1 text-gray-600"><Users size={14} /> {lead.headcount}</span>
          {lead.cateringRequired && <span className="flex items-center gap-1 text-gray-600"><UtensilsCrossed size={14} /> catering wanted</span>}
          <span className="text-gray-400 text-xs">via {lead.source.replace('_', ' ')}</span>
        </div>

        {lead.clashes.length > 0 && (
          <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            Another event already holds this date ({lead.clashes.join(', ')}).
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">{lead.name}</p>
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"><Phone size={13} /> {lead.phone}</a>
            {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"><Mail size={13} /> {lead.email}</a>}
            {lead.notes && <p className="text-gray-600 mt-2 whitespace-pre-line">“{lead.notes}”</p>}
          </div>
          {lead.quoteAmount != null && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Quote</span><span>{formatGHS(lead.quoteAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Deposit required</span><span>{formatGHS(lead.depositAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="text-lime-700">{formatGHS(lead.depositPaidAmount)}{lead.depositMethod ? ` · ${lead.depositMethod}` : ''}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance</span><span>{formatGHS(balance)}</span></div>
            </div>
          )}
        </div>

        {lead.stage === 'lost' && (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Closed as lost{lead.lostReason ? `: ${lead.lostReason}` : '.'}
            {canEdit && <Button variant="secondary" className="ml-3" loading={busy === 'reopen'} onClick={() => act('reopen', {}, 'Re-opened.')}>Re-open</Button>}
          </div>
        )}

        {canEdit && canQuote && (
          <Section title={lead.stage === 'quoted' ? 'Revise quote' : 'Send quote'}>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Total quote (GH₵)"><Input type="number" min="0" step="0.01" value={quote.quoteAmount} onChange={(e) => setQuote({ ...quote, quoteAmount: e.target.value })} /></Field>
              <Field label="Deposit to hold the date (GH₵)"><Input type="number" min="0" step="0.01" value={quote.depositAmount} onChange={(e) => setQuote({ ...quote, depositAmount: e.target.value })} /></Field>
            </div>
            <Field label="What’s included" hint="shown to the client">
              <Textarea rows={3} value={quote.quoteNotes} onChange={(e) => setQuote({ ...quote, quoteNotes: e.target.value })} placeholder="Hall hire 10am–6pm, 120 chairs, tables & linen, sound system…" />
            </Field>
            <Button loading={busy === 'quote'} disabled={!quote.quoteAmount}
              onClick={() => act('quote', { quoteAmount: quote.quoteAmount, depositAmount: quote.depositAmount || 0, quoteNotes: quote.quoteNotes }, lead.stage === 'quoted' ? 'Revised quote sent.' : 'Quote sent.')}>
              {lead.stage === 'quoted' ? 'Send revised quote' : 'Send quote'}
            </Button>
          </Section>
        )}

        {canEdit && canPay && (
          <Section title="Record a payment">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Amount (GH₵)"><Input type="number" min="0" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} /></Field>
              <Field label="Method"><Select value={payment.method} options={methodOptions} onChange={(e) => setPayment({ ...payment, method: e.target.value })} /></Field>
              <Field label="Reference" hint="MoMo / bank ref"><Input value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} /></Field>
            </div>
            <Button variant="secondary" loading={busy === 'payment'} disabled={!payment.amount}
              onClick={() => act('payment', payment, 'Payment recorded.')}>Record payment</Button>
          </Section>
        )}

        {canEdit && lead.stage !== 'lost' && (
          <Section title="Event details">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Date"><Input type="date" value={details.eventDate} onChange={(e) => setDetails({ ...details, eventDate: e.target.value })} /></Field>
              <Field label="Type"><Select value={details.eventType} options={EVENT_TYPES.includes(details.eventType) ? typeOptions : [{ value: details.eventType, label: details.eventType }, ...typeOptions]} onChange={(e) => setDetails({ ...details, eventType: e.target.value })} /></Field>
              <Field label="Guests"><Input type="number" min="1" value={details.headcount} onChange={(e) => setDetails({ ...details, headcount: e.target.value })} /></Field>
            </div>
            <Field label="Catering partner notes"><Textarea rows={2} value={details.cateringNotes} onChange={(e) => setDetails({ ...details, cateringNotes: e.target.value })} /></Field>
            <Field label="Staff notes" hint="internal"><Textarea rows={2} value={details.staffNotes} onChange={(e) => setDetails({ ...details, staffNotes: e.target.value })} /></Field>
            <Button variant="secondary" loading={busy === 'update'} onClick={() => act('update', { ...details, headcount: Number(details.headcount) }, 'Details saved.')}>Save details</Button>
          </Section>
        )}

        <ErrorText>{err}</ErrorText>

        {canEdit && lead.stage !== 'lost' && (
          <div className="flex flex-wrap items-end justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <Field label="Mark as lost"><Input placeholder="Reason (optional)" value={lostReason} onChange={(e) => setLostReason(e.target.value)} /></Field>
              <Button variant="danger" loading={busy === 'lost'} onClick={() => act('lost', { reason: lostReason }, 'Marked as lost.')}>Lost</Button>
            </div>
            {canConfirm && (
              <Button loading={busy === 'confirm'} onClick={() => act('confirm', {}, 'Event confirmed.')}>
                {lead.stage === 'quoted' ? 'Confirm without deposit' : 'Confirm event'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
      {children}
    </div>
  );
}

function AddLeadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', eventDate: '', eventType: EVENT_TYPES[0], headcount: '', cateringRequired: false, notes: '', source: 'phone' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/events', { method: 'POST', json: { ...f, headcount: Number(f.headcount) } });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add event enquiry">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event type"><Select value={f.eventType} options={typeOptions} onChange={(e) => setF({ ...f, eventType: e.target.value })} /></Field>
          <Field label="Came in by"><Select value={f.source} options={[{ value: 'phone', label: 'Phone / WhatsApp' }, { value: 'walk_in', label: 'Walk-in' }]} onChange={(e) => setF({ ...f, source: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={f.eventDate} onChange={(e) => setF({ ...f, eventDate: e.target.value })} /></Field>
          <Field label="Guests"><Input type="number" min="1" value={f.headcount} onChange={(e) => setF({ ...f, headcount: e.target.value })} /></Field>
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </div>
        <Field label="Email" hint="optional"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-lime-500" checked={f.cateringRequired} onChange={(e) => setF({ ...f, cateringRequired: e.target.checked })} /> Catering wanted</label>
        <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <p className="text-xs text-gray-500">No message is sent for enquiries added here — send the quote when it’s ready.</p>
        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={save}>Add enquiry</Button>
        </div>
      </div>
    </Modal>
  );
}
