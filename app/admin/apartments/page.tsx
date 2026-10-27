'use client';
import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Plus, Star, Trash2, Upload, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import {
  PageHeader, Button, Card, Field, Input, Textarea, Badge, Modal, Empty, ErrorText, Table, Td,
  api, useApi, cx, formatGHS, formatDate,
} from '../_components/ui';
import { useCan } from '../_components/StaffContext';

/* ── Types ─────────────────────────────────────────────────────────────── */

type Photo = { id: number; url: string; alt: string };
type Plan = {
  id: number; name: string; baseRate: number; weekendRate: number | null; weekendDays: number[]; minNights: number;
  longStayMinNights: number | null; longStayDiscountPct: number | null; validFrom: string | null; validTo: string | null; active: boolean;
};
type Apt = {
  id: number; slug: string; name: string; description: string; maxGuests: number; bedrooms: number; bathrooms: number;
  amenities: string[]; active: boolean; photos: Photo[]; ratePlans: Plan[]; upcomingBookings: number; missingBaseRate: boolean; expiredPlans: number;
};
type Policies = {
  depositPct: number; allowDeposit: boolean; allowPayOnArrival: boolean; holdMinutes: number; freeCancellationDays: number;
  cancellationFeePct: number; checkInTime: string; checkOutTime: string; cancellationText: string;
};
type Data = { apartments: Apt[]; policies: Policies };

const NIGHTS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toCedis = (p: number | null | undefined) => (p == null ? '' : String(p / 100));

async function post(json: Record<string, unknown>) {
  return api('/api/admin/apartments', { method: 'POST', json });
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function ApartmentsPage() {
  const canEdit = useCan('rates', 'full');
  const { data, loading, error, reload } = useApi<Data>('/api/admin/apartments');
  const [tab, setTab] = useState<'apartments' | 'policies'>('apartments');
  const [open, setOpen] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');

  async function act(json: Record<string, unknown>) {
    setErr('');
    try {
      await post(json);
      reload();
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    }
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Apartments & Rates"
        subtitle="What guests can book, at what price, and on what terms."
        actions={canEdit && tab === 'apartments' && <Button onClick={() => setCreating(true)}><Plus size={14} /> Add apartment</Button>}
      />

      <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm w-fit">
        {([['apartments', 'Apartments'], ['policies', 'Booking policies']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cx('px-3 py-1.5 rounded-md', tab === k ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>{label}</button>
        ))}
      </div>
      <ErrorText>{err}</ErrorText>

      {loading && !data ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : data && (tab === 'policies'
        ? <PoliciesForm policies={data.policies} canEdit={canEdit} onSaved={reload} />
        : (
          <div className="space-y-3">
            {data.apartments.map((a, i) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <button onClick={() => setOpen(open === a.id ? null : a.id)} className="flex items-center gap-3 flex-1 min-w-[220px] text-left">
                    <ChevronRight size={16} className={cx('text-gray-400 transition-transform', open === a.id && 'rotate-90')} />
                    {a.photos[0] ? <img src={a.photos[0].url} alt="" className="w-14 h-10 object-cover rounded-md" /> : <div className="w-14 h-10 rounded-md bg-gray-100" />}
                    <div>
                      <p className="font-medium text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-500">
                        Sleeps {a.maxGuests} · {a.bedrooms} bed · {a.bathrooms} bath
                        {(() => { const s = a.ratePlans.find((p) => p.active && !p.validFrom); return s ? ` · from ${formatGHS(s.baseRate)}/night` : ''; })()}
                      </p>
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.missingBaseRate && <Badge color="red">no standard rate</Badge>}
                    {a.photos.length === 0 && <Badge color="amber">no photos</Badge>}
                    {a.upcomingBookings > 0 && <Badge color="blue">{a.upcomingBookings} upcoming</Badge>}
                    {a.active ? <Badge color="green">bookable</Badge> : <Badge color="gray">hidden</Badge>}
                    {canEdit && (
                      <>
                        <Button variant="ghost" className="px-2" disabled={i === 0} onClick={() => act({ action: 'move', id: a.id, dir: -1 })} aria-label="Move up"><ChevronUp size={15} /></Button>
                        <Button variant="ghost" className="px-2" disabled={i === data.apartments.length - 1} onClick={() => act({ action: 'move', id: a.id, dir: 1 })} aria-label="Move down"><ChevronDown size={15} /></Button>
                        <Button variant="secondary" className="text-xs" onClick={() => act({ action: 'update', id: a.id, apartment: { active: !a.active } })}>
                          {a.active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Open for booking</>}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {open === a.id && (
                  <div className="border-t border-gray-100 p-5 grid xl:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <Details apt={a} canEdit={canEdit} onSaved={reload} />
                      <Photos apt={a} canEdit={canEdit} onChanged={reload} />
                    </div>
                    <Rates apt={a} canEdit={canEdit} onChanged={reload} />
                  </div>
                )}
              </div>
            ))}
            {data.apartments.length === 0 && <Empty>No apartments yet.</Empty>}
          </div>
        ))}

      {creating && <NewApartment onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
    </div>
  );
}

/* ── Details ───────────────────────────────────────────────────────────── */

function DetailFields({ f, setF, disabled }: { f: ReturnType<typeof detailState>; setF: (f: ReturnType<typeof detailState>) => void; disabled?: boolean }) {
  return (
    <div className="space-y-3 text-sm">
      <Field label="Name"><Input value={f.name} disabled={disabled} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sleeps"><Input type="number" min="1" value={f.maxGuests} disabled={disabled} onChange={(e) => setF({ ...f, maxGuests: e.target.value })} /></Field>
        <Field label="Bedrooms"><Input type="number" min="0" value={f.bedrooms} disabled={disabled} onChange={(e) => setF({ ...f, bedrooms: e.target.value })} /></Field>
        <Field label="Bathrooms"><Input type="number" min="0" value={f.bathrooms} disabled={disabled} onChange={(e) => setF({ ...f, bathrooms: e.target.value })} /></Field>
      </div>
      <Field label="Description" hint="shown to guests"><Textarea rows={3} value={f.description} disabled={disabled} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Amenities" hint="comma-separated, e.g. Wi-Fi, AC, Kitchen"><Input value={f.amenities} disabled={disabled} onChange={(e) => setF({ ...f, amenities: e.target.value })} /></Field>
    </div>
  );
}

const detailState = (a?: Apt) => ({
  name: a?.name ?? '', description: a?.description ?? '', maxGuests: String(a?.maxGuests ?? 2),
  bedrooms: String(a?.bedrooms ?? 1), bathrooms: String(a?.bathrooms ?? 1), amenities: a?.amenities.join(', ') ?? '',
});
const detailJson = (f: ReturnType<typeof detailState>) => ({
  ...f, amenities: f.amenities.split(',').map((s) => s.trim()).filter(Boolean),
});

function Details({ apt, canEdit, onSaved }: { apt: Apt; canEdit: boolean; onSaved: () => void }) {
  const [f, setF] = useState(() => detailState(apt));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const dirty = JSON.stringify(f) !== JSON.stringify(detailState(apt));
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900">Details</h4>
      <DetailFields f={f} setF={setF} disabled={!canEdit} />
      <ErrorText>{err}</ErrorText>
      {canEdit && (
        <Button disabled={!dirty} loading={busy} onClick={async () => {
          setBusy(true); setErr('');
          try { await post({ action: 'update', id: apt.id, apartment: detailJson(f) }); onSaved(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
        }}>Save details</Button>
      )}
    </div>
  );
}

function NewApartment({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState(() => detailState());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Modal open onClose={onClose} title="Add apartment">
      <div className="space-y-3">
        <DetailFields f={f} setF={setF} />
        <p className="text-xs text-gray-500">It starts hidden. Add a standard rate and photos, then open it for booking.</p>
        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!f.name.trim()} onClick={async () => {
            setBusy(true); setErr('');
            try { await post({ action: 'create', apartment: detailJson(f) }); onDone(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
          }}>Add</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Photos ────────────────────────────────────────────────────────────── */

function Photos({ apt, canEdit, onChanged }: { apt: Apt; canEdit: boolean; onChanged: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr('');
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set('apartmentId', String(apt.id));
        form.set('file', file);
        await api('/api/admin/apartments/photos', { method: 'POST', body: form });
      }
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function act(json: Record<string, unknown>) {
    setErr('');
    try { await post(json); onChanged(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Photos</h4>
        {canEdit && (
          <>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            <Button variant="secondary" className="text-xs" loading={busy} onClick={() => input.current?.click()}><Upload size={13} /> Upload</Button>
          </>
        )}
      </div>
      {apt.photos.length === 0 ? <p className="text-sm text-gray-400">No photos yet — guests see a blank card.</p> : (
        <div className="grid grid-cols-3 gap-2">
          {apt.photos.map((p, i) => (
            <div key={p.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img src={p.url} alt={p.alt} className="w-full h-24 object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 bg-white/90 text-[10px] font-medium px-1.5 py-0.5 rounded">Cover</span>}
              {canEdit && (
                <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  {i > 0 && <button onClick={() => act({ action: 'photo_cover', photoId: p.id })} className="bg-white/90 rounded p-1 hover:bg-white" aria-label="Make cover photo"><Star size={13} /></button>}
                  <button onClick={() => act({ action: 'photo_remove', photoId: p.id })} className="bg-white/90 rounded p-1 hover:bg-white text-red-600" aria-label="Remove photo"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ErrorText>{err}</ErrorText>
    </div>
  );
}

/* ── Rates ─────────────────────────────────────────────────────────────── */

const planState = (p?: Plan, seasonal = false) => ({
  name: p?.name ?? (seasonal ? '' : 'Standard'), baseRate: toCedis(p?.baseRate), weekendRate: toCedis(p?.weekendRate),
  weekendDays: p?.weekendDays ?? [5, 6], minNights: String(p?.minNights ?? 1),
  longStayMinNights: p?.longStayMinNights != null ? String(p.longStayMinNights) : '', longStayDiscountPct: p?.longStayDiscountPct != null ? String(p.longStayDiscountPct) : '',
  validFrom: p?.validFrom ?? '', validTo: p?.validTo ?? '', seasonal: p ? !!p.validFrom : seasonal,
});

function Rates({ apt, canEdit, onChanged }: { apt: Apt; canEdit: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<{ plan?: Plan; seasonal: boolean } | null>(null);
  const [err, setErr] = useState('');
  const standard = apt.ratePlans.find((p) => p.active && !p.validFrom);

  async function toggle(p: Plan) {
    setErr('');
    try { await post({ action: 'plan_active', planId: p.id, active: !p.active }); onChanged(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Nightly rates</h4>
        {canEdit && (
          <div className="flex gap-2">
            {!standard && <Button className="text-xs" onClick={() => setEditing({ seasonal: false })}><Plus size={13} /> Standard rate</Button>}
            <Button variant="secondary" className="text-xs" onClick={() => setEditing({ seasonal: true })}><Plus size={13} /> Seasonal rate</Button>
          </div>
        )}
      </div>
      {apt.missingBaseRate && (
        <p className="flex items-center gap-1.5 text-sm text-red-700"><AlertTriangle size={14} /> No standard rate — nights outside a season can’t be booked.</p>
      )}
      {apt.ratePlans.length === 0 ? <p className="text-sm text-gray-400">No rates yet.</p> : (
        <div className="-mx-5 xl:mx-0">
          <Table head={['Rate', 'Dates', 'Per night', 'Weekend', 'Min', 'Long stay', '']}>
            {apt.ratePlans.map((p) => (
              <tr key={p.id} className={cx(!p.active && 'opacity-50')}>
                <Td className="font-medium text-gray-900">{p.name}</Td>
                <Td className="whitespace-nowrap text-gray-600">{p.validFrom ? `${formatDate(p.validFrom)} – ${formatDate(p.validTo)}` : 'All year'}</Td>
                <Td className="whitespace-nowrap">{formatGHS(p.baseRate)}</Td>
                <Td className="whitespace-nowrap">{p.weekendRate ? <>{formatGHS(p.weekendRate)}<p className="text-[11px] text-gray-400">{p.weekendDays.map((d) => NIGHTS[d]).join(', ')} nights</p></> : '—'}</Td>
                <Td>{p.minNights}</Td>
                <Td className="whitespace-nowrap">{p.longStayDiscountPct ? `${p.longStayDiscountPct}% off ${p.longStayMinNights}+` : '—'}</Td>
                <Td className="whitespace-nowrap">
                  {canEdit && (
                    <div className="flex gap-2 text-xs">
                      <button className="underline text-gray-600" onClick={() => setEditing({ plan: p, seasonal: !!p.validFrom })}>Edit</button>
                      {(p.validFrom || !p.active) && <button className="underline text-gray-600" onClick={() => toggle(p)}>{p.active ? 'Switch off' : 'Switch on'}</button>}
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </div>
      )}
      <p className="text-xs text-gray-500">A seasonal rate replaces the standard rate on its dates. Weekend nights are the nights starting on the days ticked.</p>
      <ErrorText>{err}</ErrorText>
      {editing && <PlanForm apt={apt} plan={editing.plan} seasonal={editing.seasonal} onClose={() => setEditing(null)} onDone={() => { setEditing(null); onChanged(); }} />}
    </div>
  );
}

function PlanForm({ apt, plan, seasonal, onClose, onDone }: { apt: Apt; plan?: Plan; seasonal: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState(() => planState(plan, seasonal));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setBusy(true);
    setErr('');
    const { seasonal: s, ...rest } = f;
    const json = { ...rest, validFrom: s ? f.validFrom : null, validTo: s ? f.validTo : null, weekendRate: f.weekendRate || null };
    try {
      await post(plan ? { action: 'plan_update', planId: plan.id, plan: json } : { action: 'plan_add', apartmentId: apt.id, plan: json });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`${plan ? 'Edit' : 'New'} ${f.seasonal ? 'seasonal' : 'standard'} rate — ${apt.name}`}>
      <div className="space-y-3 text-sm">
        <Field label="Name"><Input placeholder={f.seasonal ? 'e.g. Christmas, PANAFEST' : 'Standard'} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        {f.seasonal && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From"><Input type="date" value={f.validFrom} onChange={(e) => setF({ ...f, validFrom: e.target.value })} /></Field>
            <Field label="To (last night)"><Input type="date" value={f.validTo} min={f.validFrom} onChange={(e) => setF({ ...f, validTo: e.target.value })} /></Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Per night (GH₵)"><Input type="number" min="0" step="0.01" value={f.baseRate} onChange={(e) => setF({ ...f, baseRate: e.target.value })} /></Field>
          <Field label="Weekend night (GH₵)" hint="optional"><Input type="number" min="0" step="0.01" value={f.weekendRate} onChange={(e) => setF({ ...f, weekendRate: e.target.value })} /></Field>
        </div>
        {f.weekendRate && (
          <div className="flex flex-wrap gap-3">
            <span className="text-gray-600">Weekend nights:</span>
            {NIGHTS.map((n, d) => (
              <label key={n} className="flex items-center gap-1">
                <input type="checkbox" className="accent-lime-500" checked={f.weekendDays.includes(d)}
                  onChange={(e) => setF({ ...f, weekendDays: e.target.checked ? [...f.weekendDays, d] : f.weekendDays.filter((x) => x !== d) })} />{n}
              </label>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Minimum nights"><Input type="number" min="1" value={f.minNights} onChange={(e) => setF({ ...f, minNights: e.target.value })} /></Field>
          <Field label="Long stay from" hint="nights"><Input type="number" min="2" value={f.longStayMinNights} onChange={(e) => setF({ ...f, longStayMinNights: e.target.value })} /></Field>
          <Field label="Discount %"><Input type="number" min="0" max="90" value={f.longStayDiscountPct} onChange={(e) => setF({ ...f, longStayDiscountPct: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-gray-500">Price changes apply to new bookings. Existing bookings keep the price they were made at.</p>
        <ErrorText>{err}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} disabled={!f.baseRate || !f.name.trim()} onClick={save}>Save rate</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Policies ──────────────────────────────────────────────────────────── */

function PoliciesForm({ policies: p, canEdit, onSaved }: { policies: Policies; canEdit: boolean; onSaved: () => void }) {
  const initial = { ...p, depositPct: String(p.depositPct), holdMinutes: String(p.holdMinutes), freeCancellationDays: String(p.freeCancellationDays), cancellationFeePct: String(p.cancellationFeePct) };
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const d = !canEdit;

  return (
    <Card>
      <div className="space-y-5 text-sm max-w-2xl">
        <section className="space-y-3">
          <h4 className="font-semibold text-gray-900">Payment</h4>
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-lime-500" disabled={d} checked={f.allowDeposit} onChange={(e) => setF({ ...f, allowDeposit: e.target.checked })} /> Let guests pay a deposit online instead of the full amount</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-lime-500" disabled={d} checked={f.allowPayOnArrival} onChange={(e) => setF({ ...f, allowPayOnArrival: e.target.checked })} /> Let guests book now and pay on arrival</label>
          <p className="text-xs text-gray-500">Until Paystack is switched on, pay on arrival is always offered.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deposit (%)"><Input type="number" min="1" max="100" disabled={d} value={f.depositPct} onChange={(e) => setF({ ...f, depositPct: e.target.value })} /></Field>
            <Field label="Hold dates while paying (minutes)"><Input type="number" min="5" max="120" disabled={d} value={f.holdMinutes} onChange={(e) => setF({ ...f, holdMinutes: e.target.value })} /></Field>
          </div>
        </section>
        <section className="space-y-3">
          <h4 className="font-semibold text-gray-900">Cancellation</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Free cancellation up to (days before arrival)"><Input type="number" min="0" disabled={d} value={f.freeCancellationDays} onChange={(e) => setF({ ...f, freeCancellationDays: e.target.value })} /></Field>
            <Field label="Fee after that (% of booking)"><Input type="number" min="0" max="100" disabled={d} value={f.cancellationFeePct} onChange={(e) => setF({ ...f, cancellationFeePct: e.target.value })} /></Field>
          </div>
          <Field label="Cancellation policy shown to guests"><Textarea rows={3} disabled={d} value={f.cancellationText} onChange={(e) => setF({ ...f, cancellationText: e.target.value })} /></Field>
        </section>
        <section className="space-y-3">
          <h4 className="font-semibold text-gray-900">Arrival & departure</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in from"><Input type="time" disabled={d} value={f.checkInTime} onChange={(e) => setF({ ...f, checkInTime: e.target.value })} /></Field>
            <Field label="Check-out by"><Input type="time" disabled={d} value={f.checkOutTime} onChange={(e) => setF({ ...f, checkOutTime: e.target.value })} /></Field>
          </div>
        </section>
        <ErrorText>{err}</ErrorText>
        {ok && !dirty && <p className="text-lime-700">Saved.</p>}
        {canEdit && (
          <Button disabled={!dirty} loading={busy} onClick={async () => {
            setBusy(true); setErr(''); setOk(false);
            try { await post({ action: 'policies', policies: f }); setOk(true); onSaved(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
          }}>Save policies</Button>
        )}
      </div>
    </Card>
  );
}
