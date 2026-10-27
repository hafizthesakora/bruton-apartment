'use client';
import { useState } from 'react';
import { MapPin, Video, Phone, Mail, Check, UserX, CheckCheck, CalendarClock } from 'lucide-react';
import { PageHeader, Card, Button, Field, Input, Select, Textarea, StatusBadge, Modal, Table, Td, Empty, ErrorText, api, useApi, cx } from '../_components/ui';
import { useCan } from '../_components/StaffContext';
import { VIEWING_TIMES } from '@/lib/viewings/slots';

type Status = 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
type Viewing = {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: 'physical' | 'virtual';
  scheduledAt: string;
  status: Status;
  notes: string;
  staffNotes: string;
};

// Accra is UTC+0: display the stored UTC time as-is.
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
});
const isLive = (s: Status) => s === 'requested' || s === 'confirmed';
const timeOptions = VIEWING_TIMES.map((t) => ({ value: t, label: t }));

export default function ViewingsPage() {
  const canEdit = useCan('bookings', 'full');
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const { data, loading, error, reload } = useApi<Viewing[]>(`/api/admin/viewings?scope=${scope}`);
  const [editing, setEditing] = useState<(Viewing & { date: string; time: string }) | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  async function update(id: number, changes: Partial<{ status: Status; date: string; time: string; staffNotes: string }>) {
    const res = await api<{ messaged: boolean }>('/api/admin/viewings', { method: 'PATCH', json: { id, ...changes } });
    setNotice(res.messaged ? 'Saved — the guest has been sent the update by email and SMS.' : 'Saved.');
    setTimeout(() => setNotice(''), 4000);
    reload();
  }

  async function quick(v: Viewing, status: Status) {
    setBusy(v.id);
    try {
      await update(v.id, { status });
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit(cancel = false) {
    if (!editing) return;
    setFormError('');
    setBusy(editing.id);
    try {
      const original = data?.find((v) => v.id === editing.id);
      const moved = original && (editing.date !== original.scheduledAt.slice(0, 10) || editing.time !== original.scheduledAt.slice(11, 16));
      await update(editing.id, {
        staffNotes: editing.staffNotes,
        ...(cancel ? { status: 'cancelled' } : moved ? { date: editing.date, time: editing.time } : {}),
      });
      setEditing(null);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const live = data?.filter((v) => isLive(v.status)).length ?? 0;

  return (
    <div className="p-8">
      <PageHeader
        title="Viewings"
        subtitle={scope === 'upcoming' ? `${live} upcoming viewing${live === 1 ? '' : 's'} booked from the website.` : 'Past viewings.'}
        actions={
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            {(['upcoming', 'past'] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)}
                className={cx('px-3 py-1.5 text-sm rounded-md capitalize', scope === s ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>
                {s}
              </button>
            ))}
          </div>
        }
      />

      {notice && <div className="mb-4 rounded-lg bg-lime-50 border border-lime-200 px-4 py-2.5 text-sm text-lime-800">{notice}</div>}

      <Card padded={false}>
        {loading ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : !data?.length ? (
          <Empty>{scope === 'upcoming' ? 'No upcoming viewings.' : 'No past viewings yet.'}</Empty>
        ) : (
          <Table head={['When', 'Guest', 'Type', 'Status', 'Notes', '']}>
            {data.map((v) => (
              <tr key={v.id} className={cx(!isLive(v.status) && scope === 'upcoming' && 'opacity-60')}>
                <Td className="font-medium text-gray-900 whitespace-nowrap">{when(v.scheduledAt)}</Td>
                <Td>
                  <p className="font-medium text-gray-900">{v.name}</p>
                  <a href={`tel:${v.phone}`} className="flex items-center gap-1 text-gray-500 hover:text-gray-800"><Phone size={12} /> {v.phone}</a>
                  <a href={`mailto:${v.email}`} className="flex items-center gap-1 text-gray-500 hover:text-gray-800"><Mail size={12} /> {v.email}</a>
                </Td>
                <Td className="whitespace-nowrap">
                  {v.type === 'virtual'
                    ? <span className="flex items-center gap-1.5"><Video size={14} /> Virtual</span>
                    : <span className="flex items-center gap-1.5"><MapPin size={14} /> On site</span>}
                </Td>
                <Td><StatusBadge status={v.status} /></Td>
                <Td className="max-w-xs text-gray-600">
                  {v.notes && <p>{v.notes}</p>}
                  {v.staffNotes && <p className="text-xs text-slate-500 mt-1">Staff: {v.staffNotes}</p>}
                </Td>
                <Td className="text-right whitespace-nowrap">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      {v.status === 'requested' && (
                        <Button variant="secondary" loading={busy === v.id} onClick={() => quick(v, 'confirmed')} title="Mark confirmed (no message sent)">
                          <Check size={14} /> Confirm
                        </Button>
                      )}
                      {isLive(v.status) && new Date(v.scheduledAt) <= new Date() && (
                        <>
                          <Button variant="secondary" loading={busy === v.id} onClick={() => quick(v, 'completed')}><CheckCheck size={14} /> Done</Button>
                          <Button variant="ghost" loading={busy === v.id} onClick={() => quick(v, 'no_show')} title="Guest didn’t come"><UserX size={14} /></Button>
                        </>
                      )}
                      <Button variant="ghost" onClick={() => {
                        setFormError('');
                        setEditing({ ...v, date: v.scheduledAt.slice(0, 10), time: v.scheduledAt.slice(11, 16) });
                      }}>
                        <CalendarClock size={14} /> Manage
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Viewing · ${editing.name}` : ''}>
        {editing && (
          <div className="space-y-4">
            {isLive(editing.status) ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
                </Field>
                <Field label="Time">
                  <Select value={editing.time} options={timeOptions} onChange={(e) => setEditing({ ...editing, time: e.target.value })} />
                </Field>
                <p className="col-span-2 text-xs text-gray-500">Changing the time sends the guest an email and SMS with the new time.</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{when(editing.scheduledAt)} · <StatusBadge status={editing.status} /></p>
            )}
            <Field label="Staff notes" hint="internal only">
              <Textarea rows={3} value={editing.staffNotes} onChange={(e) => setEditing({ ...editing, staffNotes: e.target.value })} />
            </Field>
            <ErrorText>{formError}</ErrorText>
            <div className="flex justify-between gap-2 pt-2">
              {isLive(editing.status)
                ? <Button variant="danger" loading={busy === editing.id} onClick={() => saveEdit(true)}>Cancel viewing</Button>
                : <span />}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(null)}>Close</Button>
                <Button loading={busy === editing.id} onClick={() => saveEdit()}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
