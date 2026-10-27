'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Phone, Mail, Search } from 'lucide-react';
import {
  PageHeader, Button, Field, Input, Select, Textarea, StatusBadge, Modal, Empty, ErrorText,
  api, useApi, cx, formatGHS, formatDate,
} from '../_components/ui';
import { useCan } from '../_components/StaffContext';

/* ── Types & helpers ───────────────────────────────────────────────────── */

type Source = 'direct' | 'airbnb' | 'booking_com' | 'vrbo' | 'expedia' | 'walk_in' | 'phone';
type Status = 'held' | 'pending_payment' | 'confirmed' | 'checked_in' | 'checked_out';
type Apt = { id: number; name: string; maxGuests: number; hkStatus: string };
type Booking = {
  id: number; reference: string; apartmentId: number; checkIn: string; checkOut: string; status: Status; source: Source;
  channelRef: string | null; adults: number; children: number; totalAmount: number; paid: number; balance: number;
  notes: string; guestName: string; guestPhone: string | null; guestEmail: string | null;
};
type Calendar = { from: string; to: string; apartments: Apt[]; bookings: Booking[] };

const DAY_W = 44;
const DAY_MS = 86_400_000;
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
const diffDays = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY_MS);
const today = () => new Date().toISOString().slice(0, 10); // Accra = UTC

const SOURCE_LABEL: Record<Source, string> = {
  direct: 'Website', phone: 'Phone', walk_in: 'Walk-in', airbnb: 'Airbnb', booking_com: 'Booking.com', vrbo: 'Vrbo', expedia: 'Expedia',
};
const SOURCE_COLOR: Record<Source, string> = {
  direct: 'bg-lime-400 text-slate-900', phone: 'bg-violet-400 text-white', walk_in: 'bg-amber-400 text-slate-900',
  airbnb: 'bg-rose-400 text-white', booking_com: 'bg-blue-500 text-white', vrbo: 'bg-sky-400 text-white', expedia: 'bg-yellow-300 text-slate-900',
};
const OTA: Source[] = ['airbnb', 'booking_com', 'vrbo', 'expedia'];
const sourceOptions = (Object.keys(SOURCE_LABEL) as Source[]).map((s) => ({ value: s, label: SOURCE_LABEL[s] }));
const HK_DOT: Record<string, string> = { clean: 'bg-lime-500', dirty: 'bg-red-500', in_progress: 'bg-amber-400', out_of_order: 'bg-purple-500' };

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function CalendarPage() {
  const canEdit = useCan('bookings', 'full');
  const [start, setStart] = useState(() => addDays(today(), -2));
  const [span, setSpan] = useState(21);
  const end = addDays(start, span);
  const { data, loading, error, reload } = useApi<Calendar>(`/api/admin/bookings?from=${start}&to=${end}`);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ apartmentId: number; checkIn: string } | null>(null);
  const [notice, setNotice] = useState('');

  const days = useMemo(() => Array.from({ length: span }, (_, i) => addDays(start, i)), [start, span]);
  const open = data?.bookings.find((b) => b.id === openId) ?? null;

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Booking Calendar"
        subtitle="All apartments by date. Click an empty day to add a booking, or a booking to change it."
        actions={
          <>
            <div className="flex items-center gap-1">
              <Button variant="secondary" onClick={() => setStart(addDays(start, -7))} aria-label="Back a week"><ChevronLeft size={16} /></Button>
              <Button variant="secondary" onClick={() => setStart(addDays(today(), -2))}>Today</Button>
              <Button variant="secondary" onClick={() => setStart(addDays(start, 7))} aria-label="Forward a week"><ChevronRight size={16} /></Button>
            </div>
            <Select value={span} onChange={(e) => setSpan(Number(e.target.value))}
              options={[{ value: 14, label: '2 weeks' }, { value: 21, label: '3 weeks' }, { value: 35, label: '5 weeks' }, { value: 60, label: '2 months' }]} />
            {canEdit && <Button onClick={() => setDraft({ apartmentId: data?.apartments[0]?.id ?? 0, checkIn: today() })}><Plus size={16} /> New booking</Button>}
          </>
        }
      />

      {notice && <div className="mb-4 rounded-lg bg-lime-50 border border-lime-200 px-4 py-2.5 text-sm text-lime-800">{notice}</div>}

      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600">
        {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5"><span className={cx('w-3 h-3 rounded-sm', SOURCE_COLOR[s].split(' ')[0])} />{SOURCE_LABEL[s]}</span>
        ))}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-dashed border-gray-500" />Unpaid hold</span>
      </div>

      {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : data && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <div style={{ width: 200 + span * DAY_W }}>
            {/* Header */}
            <div className="flex sticky top-0 z-10 bg-white border-b border-gray-200">
              <div className="w-[200px] shrink-0 px-4 py-2 text-xs font-medium text-gray-500 sticky left-0 bg-white z-20 border-r border-gray-100">Apartment</div>
              {days.map((d) => {
                const date = new Date(d + 'T00:00:00Z');
                const weekend = [0, 6].includes(date.getUTCDay());
                return (
                  <div key={d} style={{ width: DAY_W }}
                    className={cx('shrink-0 text-center py-1.5 text-[11px] border-r border-gray-100', weekend && 'bg-gray-50', d === today() && 'bg-lime-100 font-semibold')}>
                    <div className="text-gray-400">{date.toLocaleDateString('en-GB', { weekday: 'narrow', timeZone: 'UTC' })}</div>
                    <div className="text-gray-700">{date.getUTCDate()}</div>
                    {date.getUTCDate() === 1 && <div className="text-[9px] text-gray-400 uppercase">{date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</div>}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {data.apartments.map((apt) => (
              <div key={apt.id} className="flex border-b border-gray-100 relative h-12">
                <div className="w-[200px] shrink-0 px-4 flex items-center gap-2 sticky left-0 bg-white z-10 border-r border-gray-100">
                  <span className={cx('w-2 h-2 rounded-full shrink-0', HK_DOT[apt.hkStatus] ?? 'bg-gray-300')} title={`Housekeeping: ${apt.hkStatus.replace('_', ' ')}`} />
                  <span className="text-sm font-medium text-gray-900 truncate">{apt.name}</span>
                </div>
                {days.map((d) => (
                  <button key={d} style={{ width: DAY_W }} disabled={!canEdit}
                    onClick={() => setDraft({ apartmentId: apt.id, checkIn: d })}
                    className={cx('shrink-0 border-r border-gray-100 hover:bg-lime-50 disabled:hover:bg-transparent',
                      [0, 6].includes(new Date(d + 'T00:00:00Z').getUTCDay()) && 'bg-gray-50/60',
                      apt.hkStatus === 'out_of_order' && 'bg-[repeating-linear-gradient(45deg,#f3e8ff,#f3e8ff_4px,#fff_4px,#fff_8px)]')}
                    aria-label={`New booking: ${apt.name} from ${d}`} />
                ))}
                {data.bookings.filter((b) => b.apartmentId === apt.id).map((b) => {
                  // Bars run from mid check-in day to mid check-out day, so same-day turnovers sit side by side.
                  const s = Math.max(diffDays(start, b.checkIn) + 0.5, 0);
                  const e = Math.min(diffDays(start, b.checkOut) + 0.5, span);
                  if (e <= 0 || s >= span) return null;
                  const hold = b.status === 'held' || b.status === 'pending_payment';
                  return (
                    <button key={b.id} onClick={() => setOpenId(b.id)}
                      style={{ left: 200 + s * DAY_W + 1, width: (e - s) * DAY_W - 2 }}
                      title={`${b.guestName} · ${b.checkIn} → ${b.checkOut}`}
                      className={cx('absolute top-2 h-8 rounded-md px-2 text-left text-xs font-medium truncate shadow-sm',
                        hold ? 'bg-white text-gray-700 border border-dashed border-gray-500' : SOURCE_COLOR[b.source],
                        b.status === 'checked_out' && 'opacity-50',
                        b.status === 'checked_in' && 'ring-2 ring-slate-900')}>
                      {b.guestName}
                    </button>
                  );
                })}
              </div>
            ))}
            {data.apartments.length === 0 && <Empty>No apartments yet.</Empty>}
          </div>
        </div>
      )}

      {open && data && (
        <BookingModal booking={open} apartments={data.apartments} canEdit={canEdit}
          onClose={() => setOpenId(null)} onDone={(m) => { flash(m); setOpenId(null); reload(); }} />
      )}
      {draft && data && (
        <NewBookingModal draft={draft} apartments={data.apartments}
          onClose={() => setDraft(null)} onDone={(m) => { flash(m); setDraft(null); reload(); }} />
      )}
    </div>
  );
}

/* ── Existing booking ──────────────────────────────────────────────────── */

function BookingModal({ booking: b, apartments, canEdit, onClose, onDone }: {
  booking: Booking; apartments: Apt[]; canEdit: boolean; onClose: () => void; onDone: (msg: string) => void;
}) {
  const direct = !OTA.includes(b.source);
  const [edit, setEdit] = useState({ apartmentId: b.apartmentId, checkIn: b.checkIn, checkOut: b.checkOut, adults: String(b.adults), children: String(b.children), notes: b.notes });
  const [price, setPrice] = useState<'rates' | 'keep' | 'manual'>('rates');
  const [manual, setManual] = useState(String(b.totalAmount / 100));
  const [notify, setNotify] = useState(direct);
  const [cancel, setCancel] = useState({ fee: '', reason: '' });
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const editable = canEdit && (b.status === 'confirmed' || b.status === 'checked_in');
  const cancellable = canEdit && ['held', 'pending_payment', 'confirmed'].includes(b.status);
  const nights = diffDays(b.checkIn, b.checkOut);

  async function send(action: 'change' | 'cancel') {
    setBusy(action);
    setErr('');
    try {
      await api('/api/admin/bookings', {
        method: 'PATCH',
        json: action === 'change'
          ? { action, id: b.id, ...edit, price: price === 'manual' ? { manual } : price, notify }
          : { action, id: b.id, fee: cancel.fee || 0, reason: cancel.reason, notify },
      });
      onDone(action === 'change' ? `Booking ${b.reference} updated.` : `Booking ${b.reference} cancelled.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  return (
    <Modal open onClose={onClose} title={`${b.guestName} · ${b.reference}`} wide>
      <div className="space-y-5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={b.status} />
          <span className={cx('px-2 py-0.5 rounded-full text-xs font-medium', SOURCE_COLOR[b.source])}>{SOURCE_LABEL[b.source]}</span>
          {b.channelRef && <span className="text-xs text-gray-500">Channel ref {b.channelRef}</span>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{apartments.find((a) => a.id === b.apartmentId)?.name}</p>
            <p>{formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {nights} night{nights === 1 ? '' : 's'}</p>
            <p className="text-gray-600">{b.adults} adult{b.adults === 1 ? '' : 's'}{b.children ? `, ${b.children} child${b.children === 1 ? '' : 'ren'}` : ''}</p>
            {b.guestPhone && <a href={`tel:${b.guestPhone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"><Phone size={13} /> {b.guestPhone}</a>}
            {b.guestEmail && <a href={`mailto:${b.guestEmail}`} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"><Mail size={13} /> {b.guestEmail}</a>}
            {b.notes && <p className="text-gray-600 whitespace-pre-line pt-1">{b.notes}</p>}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 h-fit">
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span>{formatGHS(b.totalAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="text-lime-700">{formatGHS(b.paid)}</span></div>
            <div className="flex justify-between font-semibold"><span>Balance</span><span>{formatGHS(b.balance)}</span></div>
          </div>
        </div>

        {editable && (
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Move or extend</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Apartment"><Select value={edit.apartmentId} options={apartments.map((a) => ({ value: a.id, label: a.name }))} onChange={(e) => setEdit({ ...edit, apartmentId: Number(e.target.value) })} /></Field>
              <Field label="Check-in"><Input type="date" value={edit.checkIn} disabled={b.status === 'checked_in'} onChange={(e) => setEdit({ ...edit, checkIn: e.target.value })} /></Field>
              <Field label="Check-out"><Input type="date" value={edit.checkOut} min={addDays(edit.checkIn, 1)} onChange={(e) => setEdit({ ...edit, checkOut: e.target.value })} /></Field>
              <Field label="Adults"><Input type="number" min="1" value={edit.adults} onChange={(e) => setEdit({ ...edit, adults: e.target.value })} /></Field>
              <Field label="Children"><Input type="number" min="0" value={edit.children} onChange={(e) => setEdit({ ...edit, children: e.target.value })} /></Field>
            </div>
            <Field label="Notes"><Textarea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
            <div className="flex flex-wrap gap-4 items-center">
              <span className="font-medium text-gray-700">Price:</span>
              {([['rates', 'Re-price from rates'], ['keep', 'Keep current total'], ['manual', 'Set total']] as const).map(([v, label]) => (
                <label key={v} className="flex items-center gap-1.5"><input type="radio" className="accent-lime-500" checked={price === v} onChange={() => setPrice(v)} />{label}</label>
              ))}
              {price === 'manual' && <Input type="number" min="0" step="0.01" className="w-32" value={manual} onChange={(e) => setManual(e.target.value)} />}
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-lime-500" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Send the guest the updated details</label>
            <Button loading={busy === 'change'} onClick={() => send('change')}>Save changes</Button>
          </div>
        )}

        {cancellable && (
          <div className="rounded-lg border border-red-100 p-4 space-y-3">
            <h4 className="font-semibold text-red-700">Cancel booking</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Cancellation fee (GH₵)" hint="kept on the bill"><Input type="number" min="0" step="0.01" placeholder="0" value={cancel.fee} onChange={(e) => setCancel({ ...cancel, fee: e.target.value })} /></Field>
              <Field label="Reason"><Input value={cancel.reason} onChange={(e) => setCancel({ ...cancel, reason: e.target.value })} /></Field>
            </div>
            {b.paid > 0 && <p className="text-xs text-amber-700">The guest has paid {formatGHS(b.paid)}. Any refund is recorded separately on their bill.</p>}
            <Button variant="danger" loading={busy === 'cancel'} onClick={() => send('cancel')}>Cancel booking</Button>
          </div>
        )}

        <ErrorText>{err}</ErrorText>
      </div>
    </Modal>
  );
}

/* ── New booking ───────────────────────────────────────────────────────── */

type GuestHit = { id: number; fullName: string; phone: string | null; email: string | null };

function NewBookingModal({ draft, apartments, onClose, onDone }: {
  draft: { apartmentId: number; checkIn: string }; apartments: Apt[]; onClose: () => void; onDone: (msg: string) => void;
}) {
  const [f, setF] = useState({
    apartmentId: draft.apartmentId, checkIn: draft.checkIn, checkOut: addDays(draft.checkIn, 1),
    adults: '1', children: '0', source: 'walk_in' as Source, channelRef: '', notes: '',
  });
  const [guest, setGuest] = useState<{ id?: number; fullName: string; phone: string; email: string }>({ fullName: '', phone: '', email: '' });
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<GuestHit[]>([]);
  const [quote, setQuote] = useState<{ total?: number; error?: string }>({});
  const [manual, setManual] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const ota = OTA.includes(f.source);
  useEffect(() => setNotify(!ota), [ota]);

  useEffect(() => {
    let live = true;
    const qs = new URLSearchParams({ apartmentId: String(f.apartmentId), checkIn: f.checkIn, checkOut: f.checkOut });
    api<{ total: number }>(`/api/admin/bookings/quote?${qs}`)
      .then((r) => live && setQuote({ total: r.total }))
      .catch((e) => live && setQuote({ error: (e as Error).message }));
    return () => { live = false; };
  }, [f.apartmentId, f.checkIn, f.checkOut]);

  useEffect(() => {
    if (search.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => {
      api<GuestHit[]>(`/api/admin/guests?q=${encodeURIComponent(search)}`).then(setHits).catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  async function save() {
    setBusy(true);
    setErr('');
    try {
      const b = await api<{ reference: string }>('/api/admin/bookings', {
        method: 'POST',
        json: {
          ...f, apartmentId: Number(f.apartmentId),
          guest: { ...guest, email: guest.email || '' },
          ...(manual ? { totalAmount: manual } : {}),
          notify,
        },
      });
      onDone(`Booking ${b.reference} created.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="New booking" wide>
      <div className="space-y-4 text-sm">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Apartment"><Select value={f.apartmentId} options={apartments.map((a) => ({ value: a.id, label: a.name }))} onChange={(e) => setF({ ...f, apartmentId: Number(e.target.value) })} /></Field>
          <Field label="Check-in"><Input type="date" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value, checkOut: e.target.value >= f.checkOut ? addDays(e.target.value, 1) : f.checkOut })} /></Field>
          <Field label="Check-out"><Input type="date" value={f.checkOut} min={addDays(f.checkIn, 1)} onChange={(e) => setF({ ...f, checkOut: e.target.value })} /></Field>
          <Field label="Booked via"><Select value={f.source} options={sourceOptions} onChange={(e) => setF({ ...f, source: e.target.value as Source })} /></Field>
          {ota && <Field label="Channel reference" hint="from Airbnb etc."><Input value={f.channelRef} onChange={(e) => setF({ ...f, channelRef: e.target.value })} /></Field>}
          <Field label="Adults"><Input type="number" min="1" value={f.adults} onChange={(e) => setF({ ...f, adults: e.target.value })} /></Field>
          <Field label="Children"><Input type="number" min="0" value={f.children} onChange={(e) => setF({ ...f, children: e.target.value })} /></Field>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Guest</h4>
          {guest.id ? (
            <div className="flex items-center justify-between bg-lime-50 rounded-lg px-3 py-2">
              <span>{guest.fullName}{guest.phone ? ` · ${guest.phone}` : ''}{guest.email ? ` · ${guest.email}` : ''}</span>
              <button className="text-xs text-gray-600 underline" onClick={() => setGuest({ fullName: '', phone: '', email: '' })}>Change</button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input className="pl-8" placeholder="Find a returning guest by name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                {hits.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                    {hits.map((h) => (
                      <button key={h.id} className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                        onClick={() => { setGuest({ id: h.id, fullName: h.fullName, phone: h.phone ?? '', email: h.email ?? '' }); setSearch(''); setHits([]); }}>
                        <span className="font-medium">{h.fullName}</span> <span className="text-gray-500">{[h.phone, h.email].filter(Boolean).join(' · ')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Full name"><Input value={guest.fullName} onChange={(e) => setGuest({ ...guest, fullName: e.target.value })} /></Field>
                <Field label="Phone"><Input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} /></Field>
                <Field label="Email" hint="optional"><Input type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} /></Field>
              </div>
            </>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <span className="text-gray-500">Rate plan price: </span>
            {quote.total != null ? <span className="font-semibold">{formatGHS(quote.total)}</span> : <span className="text-amber-700">{quote.error ?? '…'}</span>}
          </div>
          <Field label="Agreed total (GH₵)" hint="leave blank to use the rate"><Input type="number" min="0" step="0.01" value={manual} onChange={(e) => setManual(e.target.value)} /></Field>
        </div>
        {ota && <p className="text-xs text-gray-500">Channel bookings are recorded as paid on the channel, so the bill balances.</p>}

        <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-lime-500" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Send the guest a booking confirmation (email / SMS)</label>

        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!guest.fullName} onClick={save}>Create booking</Button>
        </div>
      </div>
    </Modal>
  );
}
