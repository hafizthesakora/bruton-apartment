'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  LogIn, LogOut, BedDouble, Sparkles, Wrench, UtensilsCrossed, Receipt, Eye, PartyPopper, Mail, AlertTriangle, Check, MessageSquare, Phone,
  FileText, Images, Settings,
} from 'lucide-react';
import { Card, Empty, Badge, Button, Textarea, ErrorText, api, useApi, cx, formatGHS, formatDate } from './_components/ui';
import { useState } from 'react';
import { useCan, useStaff } from './_components/StaffContext';

type Dash = {
  today: string;
  frontDesk?: { arrivals: number; arrived: number; departures: number; inHouse: number; noShows: number; apartments: number; occupiedTonight: number };
  housekeeping?: Partial<Record<'clean' | 'dirty' | 'in_progress' | 'out_of_order', number>>;
  maintenance?: { open: number; urgent: number };
  kitchen?: { open: number };
  payments?: { owing: number; bills: number };
  viewings?: { today: number; toConfirm: number };
  events?: { upcoming: { id: number; name: string; eventType: string; eventDate: string; stage: string }[]; newLeads: number };
  enquiries?: { unread: number };
  alerts?: { id: number; type: string; message: string; bookingId: number | null; createdAt: string }[];
  changeRequests?: ChangeRequest[];
};
type ChangeRequest = {
  id: number; bookingId: number; message: string; createdAt: string; reference: string; guestName: string;
  guestPhone: string | null; checkIn: string; checkOut: string; apartmentName: string;
};

function greeting() {
  const h = new Date().getUTCHours(); // Accra = UTC
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Tile({ href, icon, label, value, sub, tone }: { href: string; icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; tone?: 'warn' | 'bad' }) {
  return (
    <Link href={href} className={cx('rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow block',
      tone === 'bad' ? 'border-red-200 bg-red-50/40' : tone === 'warn' ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200')}>
      <div className="flex items-center justify-between text-gray-500">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const staff = useStaff();
  const { data: d, loading, error, reload } = useApi<Dash>('/api/admin/dashboard');
  const canResolve = useCan('payments', 'full');
  const canContent = useCan('content', 'full');

  async function resolve(id: number) {
    await api('/api/admin/dashboard', { method: 'POST', json: { alertId: id } }).catch(() => null);
    reload();
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()}{staff ? `, ${staff.name.split(' ')[0]}` : ''}</h1>
        <p className="text-gray-500 text-sm mt-1">{d ? formatDate(d.today) : ''} — here’s today at Bruton Gardens.</p>
      </div>

      {loading && !d ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : d && (
        <>
          {d.alerts && d.alerts.length > 0 && (
            <Card title={<span className="flex items-center gap-2 text-red-700"><AlertTriangle size={16} /> Needs attention · {d.alerts.length}</span>} padded={false}>
              {d.alerts.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 last:border-0 text-sm">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-gray-900">{a.message}</p>
                    <p className="text-xs text-gray-500">{formatDate(a.createdAt, true)} · {a.type.replace(/_/g, ' ')}</p>
                  </div>
                  {a.bookingId && <Link href={`/admin/folios/${a.bookingId}`} className="text-xs underline text-gray-600">Open bill</Link>}
                  {canResolve && <button onClick={() => resolve(a.id)} className="flex items-center gap-1 text-xs text-lime-700 hover:text-lime-900"><Check size={13} /> Dealt with</button>}
                </div>
              ))}
            </Card>
          )}

          {d.changeRequests && d.changeRequests.length > 0 && (
            <Card title={<span className="flex items-center gap-2"><MessageSquare size={16} /> Guest requests · {d.changeRequests.length}</span>} padded={false}>
              {d.changeRequests.map((r) => <RequestRow key={r.id} r={r} onDone={reload} />)}
            </Card>
          )}

          {d.frontDesk && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Front desk</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Tile href="/admin/front-desk" icon={<LogIn size={16} />} label="Arrivals to check in" value={d.frontDesk.arrivals}
                  sub={d.frontDesk.arrived ? `${d.frontDesk.arrived} already in` : undefined} />
                <Tile href="/admin/front-desk" icon={<LogOut size={16} />} label="Departures to check out" value={d.frontDesk.departures} tone={d.frontDesk.departures > 0 ? 'warn' : undefined} />
                <Tile href="/admin/calendar" icon={<BedDouble size={16} />} label="Occupied tonight"
                  value={`${d.frontDesk.occupiedTonight} / ${d.frontDesk.apartments}`} sub={`${d.frontDesk.inHouse} guest${d.frontDesk.inHouse === 1 ? '' : 's'} in house`} />
                <Tile href="/admin/front-desk" icon={<AlertTriangle size={16} />} label="Not arrived" value={d.frontDesk.noShows} sub="confirmed, past arrival date" tone={d.frontDesk.noShows > 0 ? 'bad' : undefined} />
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Operations</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {d.housekeeping && (
                <Tile href="/admin/housekeeping" icon={<Sparkles size={16} />} label="Rooms to clean"
                  value={(d.housekeeping.dirty ?? 0) + (d.housekeeping.in_progress ?? 0)}
                  sub={`${d.housekeeping.clean ?? 0} clean${d.housekeeping.out_of_order ? ` · ${d.housekeeping.out_of_order} out of order` : ''}`}
                  tone={(d.housekeeping.dirty ?? 0) > 0 ? 'warn' : undefined} />
              )}
              {d.maintenance && (
                <Tile href="/admin/maintenance" icon={<Wrench size={16} />} label="Open repairs" value={d.maintenance.open}
                  sub={d.maintenance.urgent ? `${d.maintenance.urgent} urgent` : undefined} tone={d.maintenance.urgent ? 'bad' : undefined} />
              )}
              {d.kitchen && (
                <Tile href="/admin/kitchen" icon={<UtensilsCrossed size={16} />} label="Kitchen orders open" value={d.kitchen.open} tone={d.kitchen.open > 0 ? 'warn' : undefined} />
              )}
              {d.payments && (
                <Tile href="/admin/folios" icon={<Receipt size={16} />} label="Owed by guests" value={formatGHS(d.payments.owing)}
                  sub={`${d.payments.bills} bill${d.payments.bills === 1 ? '' : 's'} open`} tone={d.payments.owing > 0 ? 'warn' : undefined} />
              )}
              {d.viewings && (
                <Tile href="/admin/viewings" icon={<Eye size={16} />} label="Viewings today" value={d.viewings.today}
                  sub={d.viewings.toConfirm ? `${d.viewings.toConfirm} to confirm` : undefined} tone={d.viewings.toConfirm ? 'warn' : undefined} />
              )}
              {d.events && (
                <Tile href="/admin/events" icon={<PartyPopper size={16} />} label="New event enquiries" value={d.events.newLeads} tone={d.events.newLeads ? 'warn' : undefined} />
              )}
              {d.enquiries && (
                <Tile href="/admin/enquiries" icon={<Mail size={16} />} label="Unread messages" value={d.enquiries.unread} tone={d.enquiries.unread ? 'warn' : undefined} />
              )}
            </div>
          </section>

          {d.events && d.events.upcoming.length > 0 && (
            <Card title="Events in the next two weeks" padded={false}>
              {d.events.upcoming.map((e) => (
                <Link key={e.id} href="/admin/events" className="flex items-center justify-between px-6 py-3 border-b border-gray-100 last:border-0 text-sm hover:bg-gray-50">
                  <span><b className="font-medium">{e.eventType}</b> · {e.name}</span>
                  <span className="flex items-center gap-2">{formatDate(e.eventDate)} <Badge color={e.stage === 'confirmed' ? 'green' : 'amber'}>{e.stage.replace('_', ' ')}</Badge></span>
                </Link>
              ))}
            </Card>
          )}

          {canContent && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Website</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { href: '/admin/content', label: 'Page content', icon: FileText },
                  { href: '/admin/media', label: 'Image carousel', icon: Images },
                  { href: '/admin/settings', label: 'Settings', icon: Settings },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50">
                    <l.icon size={15} className="text-gray-400" /> {l.label}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function RequestRow({ r, onDone }: { r: ChangeRequest; onDone: () => void }) {
  const canAnswer = useCan('bookings', 'full');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function send(response: string) {
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/change-requests', { method: 'POST', json: { id: r.id, response } });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-6 py-4 border-b border-gray-100 last:border-0 text-sm space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <p><b className="font-medium">{r.guestName}</b> · <Link href={`/admin/folios/${r.bookingId}`} className="underline">{r.reference}</Link> · {r.apartmentName}, {formatDate(r.checkIn)} → {formatDate(r.checkOut)}</p>
        <span className="text-xs text-gray-500">{formatDate(r.createdAt, true)}</span>
      </div>
      <p className="bg-lime-50 border-l-4 border-lime-400 px-3 py-2 whitespace-pre-line">{r.message}</p>
      {r.guestPhone && <a href={`tel:${r.guestPhone}`} className="inline-flex items-center gap-1 text-xs text-gray-600"><Phone size={12} /> {r.guestPhone}</a>}
      {canAnswer && (
        <div className="space-y-2">
          <Textarea rows={2} placeholder="Reply to the guest (sent by email/SMS). Make any change on the calendar first." value={reply} onChange={(e) => setReply(e.target.value)} />
          <ErrorText>{err}</ErrorText>
          <div className="flex gap-2">
            <Button className="text-xs" loading={busy} disabled={!reply.trim()} onClick={() => send(reply)}>Send reply & close</Button>
            <Button variant="ghost" className="text-xs" disabled={busy} onClick={() => send('')}>Close without reply</Button>
          </div>
        </div>
      )}
    </div>
  );
}
