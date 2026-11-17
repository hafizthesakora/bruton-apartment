'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { RefreshCw, Copy, Link2 } from 'lucide-react';
import { PageHeader, Card, Field, Input, Select, Button, ErrorText, Empty, api, useApi, formatDate } from '../_components/ui';
import { useCan } from '../_components/StaffContext';

type Feed = { id: number; apartmentId: number; source: string; url: string; exportToken: string; enabled: boolean; lastSyncedAt: string | null; lastError: string | null; result: { imported: number; updated: number; cancelled: number; conflicts: number } | null };
type Board = { apartments: { id: number; name: string }[]; feeds: Feed[] };
const LABELS: Record<string, string> = { airbnb: 'Airbnb', booking_com: 'Booking.com', vrbo: 'Vrbo', expedia: 'Expedia' };

export default function ChannelPage() {
  const { data, loading, error, reload } = useApi<Board>('/api/admin/channel');
  const canEdit = useCan('channel', 'full');
  const [form, setForm] = useState({ apartmentId: '', source: 'airbnb', url: '' });
  const [busy, setBusy] = useState<number | 'save' | null>(null);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  async function action(json: Record<string, unknown>, key: number | 'save') {
    setBusy(key); setErr(''); setNotice('');
    try {
      const result = await api<{ conflicts?: number }>('/api/admin/channel', { method: 'POST', json });
      if (json.action === 'sync') setNotice(result.conflicts ? `Sync completed with ${result.conflicts} conflict(s). Review the dashboard alerts; existing reservations were preserved.` : 'Calendar synced successfully.');
      else if (json.action === 'disconnect') setNotice('Disconnected. Existing imported reservations remain on the booking calendar for review.');
      else { setNotice('Connection saved. Click Sync now, then add the export link to the booking channel.'); setForm({ ...form, url: '' }); }
      reload();
    } catch (error) { setErr((error as Error).message); }
    finally { setBusy(null); }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    return action({ action: 'save', ...form, apartmentId: Number(form.apartmentId) }, 'save');
  }
  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setNotice('Calendar link copied. Keep this link private.'); }
    catch { setErr('Copy was unavailable. Select and copy the export link below.'); }
  }

  return <div className="p-4 sm:p-8 space-y-6">
    <PageHeader title="Channel Sync" subtitle="Connect each physical apartment to its booking channel calendar." />
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-relaxed text-blue-950">
      <p>1. Choose the exact apartment and paste its calendar export URL from Airbnb, Booking.com, Vrbo or Expedia.</p>
      <p>2. Save and select <strong>Sync now</strong> to block booked dates on this website.</p>
      <p>3. Copy this website’s export link into the matching channel listing to block direct reservations there.</p>
      <p className="mt-3">Calendar connections share availability dates. Prices, payments and guest details must be managed in the booking channel. Updates depend on when each channel refreshes its calendar. The configured daily background job also imports calendars; use Sync now for an immediate refresh.</p>
    </div>
    <ErrorText>{err || error}</ErrorText>
    {notice && <p role="status" className="rounded-lg bg-lime-50 p-4 text-sm text-slate-900">{notice}</p>}
    {canEdit && <Card title="Connect a calendar"><form onSubmit={save} className="grid items-end gap-4 md:grid-cols-2">
      <Field label="Apartment"><Select required value={form.apartmentId} onChange={(e) => setForm({ ...form, apartmentId: e.target.value })} options={[{ value: '', label: 'Choose an apartment' }, ...(data?.apartments ?? []).map((a) => ({ value: a.id, label: a.name }))]} /></Field>
      <Field label="Channel"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} options={Object.entries(LABELS).map(([value, label]) => ({ value, label }))} /></Field>
      <div className="md:col-span-2"><Field label="Channel calendar export URL"><Input type="url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…/calendar/…ics" /></Field></div>
      <Button type="submit" disabled={busy !== null} loading={busy === 'save'}><Link2 size={16} /> Save connection</Button>
    </form></Card>}
    {loading && !data ? <Empty>Loading connections…</Empty> : data?.feeds.length === 0 ? <Empty>No calendars connected yet.</Empty> : data?.feeds.map((feed) => {
      const link = `${origin}/api/channel/${feed.id}?token=${feed.exportToken}`;
      return <Card key={feed.id} title={`${data.apartments.find((a) => a.id === feed.apartmentId)?.name ?? 'Archived apartment'} · ${LABELS[feed.source] ?? feed.source}`} actions={<span className="text-xs text-gray-600">{feed.enabled ? 'Connected' : 'Disconnected'}</span>}>
        <div className="space-y-3 text-sm text-gray-700">
          <p>Last successful sync: {feed.lastSyncedAt ? formatDate(feed.lastSyncedAt, true) : 'Never'}</p>
          {feed.result && <p>{feed.result.imported} imported · {feed.result.updated} updated · {feed.result.cancelled} cancelled · {feed.result.conflicts} conflicts</p>}
          {feed.lastError && <p role="alert" className="text-red-700">{feed.lastError}</p>}
          {feed.enabled && <Field label="Website availability export link"><div className="flex gap-2"><Input value={link} readOnly aria-label="Website calendar export URL" onFocus={(e) => e.target.select()} /><Button variant="secondary" onClick={() => copy(link)} aria-label="Copy export link"><Copy size={15} /></Button></div></Field>}
          {canEdit && feed.enabled && <div className="flex flex-wrap gap-2"><Button disabled={busy !== null} loading={busy === feed.id} onClick={() => action({ action: 'sync', id: feed.id }, feed.id)}><RefreshCw size={15} /> Sync now</Button><Button variant="danger" disabled={busy !== null} onClick={() => action({ action: 'disconnect', id: feed.id }, feed.id)}>Disconnect</Button></div>}
        </div>
      </Card>;
    })}
  </div>;
}
