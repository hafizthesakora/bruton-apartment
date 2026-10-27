'use client';
import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader, Button, Card, Input, Empty, Table, Td, useApi, cx, formatGHS, formatDate } from '../_components/ui';
import type { Report } from '@/lib/reports';

/* ── Date presets ──────────────────────────────────────────────────────── */

const iso = (d: Date) => d.toISOString().slice(0, 10);
const today = () => new Date(); // Accra = UTC
function preset(key: string): [string, string] {
  const t = today();
  const y = t.getUTCFullYear(), m = t.getUTCMonth();
  switch (key) {
    case 'last_month': return [iso(new Date(Date.UTC(y, m - 1, 1))), iso(new Date(Date.UTC(y, m, 0)))];
    case 'last_30': return [iso(new Date(t.getTime() - 29 * 86_400_000)), iso(t)];
    case 'year': return [iso(new Date(Date.UTC(y, 0, 1))), iso(new Date(Date.UTC(y, 11, 31)))];
    case 'next_30': return [iso(t), iso(new Date(t.getTime() + 29 * 86_400_000))];
    default: return [iso(new Date(Date.UTC(y, m, 1))), iso(new Date(Date.UTC(y, m + 1, 0)))]; // this month
  }
}
const PRESETS = [['month', 'This month'], ['last_month', 'Last month'], ['last_30', 'Last 30 days'], ['next_30', 'Next 30 days'], ['year', 'This year']] as const;

const pct = (f: number) => `${(f * 100).toFixed(f >= 0.1 || f === 0 ? 0 : 1)}%`;
const STAGE_LABEL: Record<string, string> = { lead: 'Lead', quoted: 'Quoted', deposit_paid: 'Deposit paid', confirmed: 'Confirmed', lost: 'Lost' };

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function ReportsPage() {
  const [range, setRange] = useState<[string, string]>(() => preset('month'));
  const [active, setActive] = useState<string>('month');
  const [from, to] = range;
  const { data: r, loading, error } = useApi<Report>(from && to && to >= from ? `/api/admin/reports?from=${from}&to=${to}` : null);

  function pick(key: string) {
    setActive(key);
    setRange(preset(key));
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Occupancy, average rate and revenue by apartment, channel and event. Figures are live."
        actions={
          <a href={`/api/admin/reports?from=${from}&to=${to}&format=xlsx`}>
            <Button variant="secondary" disabled={!r}><Download size={14} /> Excel</Button>
          </a>
        }
      />

      {/* Filters: one row above the charts */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
          {PRESETS.map(([key, label]) => (
            <button key={key} onClick={() => pick(key)}
              className={cx('px-3 py-1.5 rounded-md', active === key ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50')}>{label}</button>
          ))}
        </div>
        <Input type="date" className="w-40" value={from} onChange={(e) => { setActive(''); setRange([e.target.value, to]); }} />
        <span className="text-gray-400">→</span>
        <Input type="date" className="w-40" value={to} min={from} onChange={(e) => { setActive(''); setRange([from, e.target.value]); }} />
      </div>

      {loading && !r ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : r && <ReportBody r={r} />}
    </div>
  );
}

function ReportBody({ r }: { r: Report }) {
  const s = r.summary;
  return (
    <div className={cx('space-y-6')}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Occupancy" value={pct(s.occupancy)} sub={`${s.nightsSold} of ${s.available} nights`} />
        <Tile label="Average daily rate" value={formatGHS(s.adr)} sub={`RevPAR ${formatGHS(s.revpar)}`} />
        <Tile label="Total revenue" value={formatGHS(s.totalRevenue)} sub={`Rooms ${formatGHS(s.roomRevenue)}`} />
        <Tile label="Cash in less expenses" value={formatGHS(s.net)} sub={`${formatGHS(s.cashIn)} in · ${formatGHS(s.expenses)} out`} negative={s.net < 0} />
      </div>

      <OccupancyChart daily={r.daily} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="By apartment" padded={false}>
          <Table head={['Apartment', 'Nights', 'Occupancy', 'Revenue', 'ADR']}>
            {r.byApartment.map((a) => (
              <tr key={a.apartmentId}>
                <Td className="font-medium text-gray-900">{a.name}</Td>
                <Td>{a.nights}</Td>
                <Td><Meter value={a.occupancy} /></Td>
                <Td className="whitespace-nowrap">{formatGHS(a.revenue)}</Td>
                <Td className="whitespace-nowrap">{a.nights ? formatGHS(a.adr) : '—'}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="By booking source" padded={false}>
          {r.bySource.length === 0 ? <Empty>No stays in this period.</Empty> : (
            <Table head={['Source', 'Bookings', 'Nights', 'Revenue', 'Share']}>
              {r.bySource.map((x) => (
                <tr key={x.source}>
                  <Td className="font-medium text-gray-900">{x.label}</Td>
                  <Td>{x.bookings}</Td>
                  <Td>{x.nights}</Td>
                  <Td className="whitespace-nowrap">{formatGHS(x.revenue)}</Td>
                  <Td><Meter value={x.share} /></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Revenue breakdown">
          <div className="space-y-2 text-sm">
            <Line label="Room revenue (nights in period)" value={s.roomRevenue} />
            <Line label="Room-service orders" value={r.other.orders} />
            <Line label="Extras (pickups, laundry…)" value={r.other.extras} />
            <Line label="Cancellation fees" value={r.other.cancellations} />
            <Line label="Discounts & adjustments" value={r.other.adjustments} />
            <Line label={`Events won (${r.events.won})`} value={s.eventRevenue} />
            <div className="border-t border-gray-100 pt-2"><Line label="Total" value={s.totalRevenue} bold /></div>
          </div>
        </Card>

        <Card title="Events (by event date)" padded={false}>
          <Table head={['Stage', 'Events', 'Quoted value']}>
            {r.events.stages.map((e) => (
              <tr key={e.stage}>
                <Td>{STAGE_LABEL[e.stage]}</Td>
                <Td>{e.count}</Td>
                <Td className="whitespace-nowrap">{e.value ? formatGHS(e.value) : '—'}</Td>
              </tr>
            ))}
          </Table>
          <p className="px-4 py-3 text-sm text-gray-600 border-t border-gray-100">Deposits received in this period: <b>{formatGHS(r.events.depositsReceived)}</b></p>
        </Card>

        <Card title="Payments received" padded={false}>
          {r.payments.length === 0 ? <Empty>No payments in this period.</Empty> : (
            <Table head={['Method', 'Received', 'Refunded', 'Net']}>
              {r.payments.map((p) => (
                <tr key={p.method}>
                  <Td>{p.label}</Td>
                  <Td className="whitespace-nowrap">{formatGHS(p.received)}</Td>
                  <Td className="whitespace-nowrap">{p.refunded ? formatGHS(p.refunded) : '—'}</Td>
                  <Td className="whitespace-nowrap font-medium">{formatGHS(p.net)}</Td>
                </tr>
              ))}
            </Table>
          )}
          {r.events.depositsReceived > 0 && (
            <p className="px-4 py-3 text-sm text-gray-600 border-t border-gray-100 flex justify-between"><span>Event deposits</span><b>{formatGHS(r.events.depositsReceived)}</b></p>
          )}
          <p className="px-4 py-3 text-xs text-gray-500 border-t border-gray-100">“Paid to channel” is money Airbnb etc. collected; it isn’t counted as cash in.</p>
        </Card>

        <Card title="Expenses" padded={false}>
          {r.expenses.length === 0 ? <Empty>No expenses recorded in this period.</Empty> : (
            <Table head={['Category', 'Entries', 'Amount']}>
              {r.expenses.map((e) => (
                <tr key={e.category}>
                  <Td>{e.category}</Td>
                  <Td>{e.count}</Td>
                  <Td className="whitespace-nowrap">{formatGHS(e.amount)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── Pieces ────────────────────────────────────────────────────────────── */

function Tile({ label, value, sub, negative }: { label: string; value: string; sub?: string; negative?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cx('text-2xl font-semibold mt-1', negative ? 'text-red-700' : 'text-gray-900')}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={cx('flex justify-between', bold && 'font-semibold text-gray-900')}>
      <span className={bold ? '' : 'text-gray-600'}>{label}</span>
      <span className={value < 0 ? 'text-red-700' : ''}>{formatGHS(value)}</span>
    </div>
  );
}

/** Inline share bar; the number beside it carries the value, so it's never colour alone. */
function Meter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-[#65a30d]" style={{ width: `${Math.min(value, 1) * 100}%` }} /></div>
      <span className="text-xs text-gray-600 w-9 text-right">{pct(value)}</span>
    </div>
  );
}

/* ── Daily occupancy chart ─────────────────────────────────────────────── */

const CHART_H = 160;

function OccupancyChart({ daily }: { daily: Report['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const longRange = daily.length > 62;

  // Long ranges are summed by month so the bars stay readable.
  const points = useMemo(() => {
    if (!longRange) return daily.map((d) => ({ key: d.day, label: formatDate(d.day), occupancy: d.occupancy, revenue: d.revenue, nights: d.nights }));
    const months = new Map<string, { key: string; label: string; occ: number; n: number; revenue: number; nights: number }>();
    for (const d of daily) {
      const k = d.day.slice(0, 7);
      const m = months.get(k) ?? { key: k, label: new Date(k + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }), occ: 0, n: 0, revenue: 0, nights: 0 };
      m.occ += d.occupancy; m.n += 1; m.revenue += d.revenue; m.nights += d.nights;
      months.set(k, m);
    }
    return [...months.values()].map((m) => ({ key: m.key, label: m.label, occupancy: m.occ / m.n, revenue: m.revenue, nights: m.nights }));
  }, [daily, longRange]);

  const h = hover != null ? points[hover] : null;

  return (
    <Card
      title={longRange ? 'Occupancy by month' : 'Occupancy by night'}
      actions={<button onClick={() => setAsTable(!asTable)} className="text-xs text-gray-500 underline">{asTable ? 'Show chart' : 'Show as table'}</button>}
    >
      {asTable ? (
        <div className="max-h-80 overflow-auto -mx-6 -my-6">
          <Table head={[longRange ? 'Month' : 'Night', 'Occupancy', 'Nights sold', 'Room revenue']}>
            {points.map((p) => (
              <tr key={p.key}><Td>{p.label}</Td><Td>{pct(p.occupancy)}</Td><Td>{p.nights}</Td><Td>{formatGHS(p.revenue)}</Td></tr>
            ))}
          </Table>
        </div>
      ) : (
        <div className="relative">
          <div className="h-5 text-xs text-gray-600">
            {h ? <span><b className="text-gray-900">{h.label}</b> · {pct(h.occupancy)} occupied · {h.nights} night{h.nights === 1 ? '' : 's'} · {formatGHS(h.revenue)}</span>
              : <span className="text-gray-400">Hover a bar for the figures</span>}
          </div>
          <div className="flex mt-2">
            {/* y axis */}
            <div className="relative w-10 shrink-0 text-[10px] text-gray-400" style={{ height: CHART_H }}>
              {[1, 0.5, 0].map((v) => <span key={v} className="absolute right-2 -translate-y-1/2" style={{ top: (1 - v) * CHART_H }}>{v * 100}%</span>)}
            </div>
            <div className="relative flex-1" style={{ height: CHART_H }}>
              {[1, 0.5].map((v) => <div key={v} className="absolute inset-x-0 border-t border-dashed border-gray-100" style={{ top: (1 - v) * CHART_H }} />)}
              <div className="absolute inset-x-0 bottom-0 border-t border-gray-300" />
              <div className="absolute inset-0 flex items-end">
                {points.map((p, i) => (
                  <div key={p.key} className="flex-1 h-full flex items-end justify-center cursor-default"
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                    aria-label={`${p.label}: ${pct(p.occupancy)}`}>
                    <div className={cx('w-full max-w-[24px] mx-px rounded-t-[4px] transition-opacity', hover != null && hover !== i && 'opacity-50')}
                      style={{ height: Math.max(p.occupancy * CHART_H, p.occupancy > 0 ? 2 : 0), background: '#65a30d' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* x labels: first, middle, last */}
          <div className="flex justify-between pl-10 mt-1 text-[10px] text-gray-400">
            <span>{points[0]?.label}</span>
            {points.length > 2 && <span>{points[Math.floor(points.length / 2)].label}</span>}
            <span>{points[points.length - 1]?.label}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
