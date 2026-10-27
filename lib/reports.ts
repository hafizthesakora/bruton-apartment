/**
 * Reports — plan §4: occupancy, ADR, revenue by apartment / event / source; Excel export.
 *
 * Computed live from the ledger for the chosen dates (from..to, both inclusive), so the figures
 * are always current rather than waiting for a nightly refresh.
 *
 * - Room revenue is accrued per night: a booking's current total spread evenly over its nights,
 *   counting only the nights that fall in the range. Cancelled bookings earn no room revenue.
 * - Other folio charges count on the day they were posted: room-service orders, extras,
 *   cancellation fees, and adjustments (negative). Accommodation lines are skipped — the
 *   booking total already covers them.
 * - Cash in = payments received minus refunds, by day posted. OTA bookings are paid to the channel.
 */
import { and, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { apartments, bookings, eventLeads, expenses, folioEntries } from '@/lib/db/schema';
import { addDays, isISODate, nightsBetween } from '@/lib/booking/pricing';
import { BookingError } from '@/lib/booking/engine';
import type { Sheet } from '@/lib/xlsx';

const SOURCE_LABEL: Record<string, string> = {
  direct: 'Website', phone: 'Phone', walk_in: 'Walk-in', airbnb: 'Airbnb', booking_com: 'Booking.com', vrbo: 'Vrbo', expedia: 'Expedia',
};
const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash', momo: 'Mobile Money', transfer: 'Bank transfer', card: 'Card', paystack: 'Paystack', ota: 'Paid to channel',
};

/** What a non-accommodation folio charge is, for the revenue breakdown. */
function chargeKind(e: { description: string; orderId: number | null; amount: number }) {
  if (e.orderId != null) return 'orders';
  const d = e.description;
  if (d.startsWith('Accommodation') || d.startsWith('Stay changed') || d.startsWith('Booking cancelled')) return null;
  if (d === 'Cancellation fee') return 'cancellations';
  if (d.startsWith('Adjustment:') || e.amount < 0) return 'adjustments';
  return 'extras';
}

export async function report(db: DB, from: string, to: string) {
  if (!isISODate(from) || !isISODate(to) || to < from) throw new BookingError(400, 'Choose a valid date range');
  const days = nightsBetween(from, to) + 1;
  if (days > 731) throw new BookingError(400, 'Choose two years or less');
  const end = addDays(to, 1); // exclusive
  const fromTs = new Date(from + 'T00:00:00Z');
  const endTs = new Date(end + 'T00:00:00Z');

  const [apts, stays, charges, money, events, spend] = await Promise.all([
    db.select({ id: apartments.id, name: apartments.name }).from(apartments).where(eq(apartments.active, true)).orderBy(apartments.sortOrder, apartments.id),
    db.select({
      id: bookings.id, apartmentId: bookings.apartmentId, source: bookings.source, checkIn: bookings.checkIn, checkOut: bookings.checkOut, total: bookings.totalAmount,
    }).from(bookings).where(and(
      inArray(bookings.status, ['confirmed', 'checked_in', 'checked_out']),
      lt(bookings.checkIn, end), gte(bookings.checkOut, addDays(from, 1)),
    )),
    db.select({ description: folioEntries.description, amount: folioEntries.amount, orderId: folioEntries.orderId, createdAt: folioEntries.createdAt })
      .from(folioEntries).where(and(eq(folioEntries.type, 'charge'), gte(folioEntries.createdAt, fromTs), lt(folioEntries.createdAt, endTs))),
    db.select({
      method: folioEntries.method,
      payments: sql<number>`coalesce(sum(${folioEntries.amount}) filter (where ${folioEntries.type} = 'payment'), 0)::int`,
      refunds: sql<number>`coalesce(sum(${folioEntries.amount}) filter (where ${folioEntries.type} = 'refund'), 0)::int`,
    }).from(folioEntries)
      .where(and(inArray(folioEntries.type, ['payment', 'refund']), gte(folioEntries.createdAt, fromTs), lt(folioEntries.createdAt, endTs)))
      .groupBy(folioEntries.method),
    db.select({
      id: eventLeads.id, eventDate: eventLeads.eventDate, stage: eventLeads.stage, quoteAmount: eventLeads.quoteAmount,
      depositPaidAmount: eventLeads.depositPaidAmount, depositPaidAt: eventLeads.depositPaidAt,
    }).from(eventLeads),
    db.select({ category: expenses.category, amount: sql<number>`sum(${expenses.amount})::int`, count: sql<number>`count(*)::int` })
      .from(expenses).where(and(gte(expenses.date, from), lte(expenses.date, to))).groupBy(expenses.category),
  ]);

  /* Room nights & revenue, per apartment / source / day */
  const byApt = new Map(apts.map((a) => [a.id, { apartmentId: a.id, name: a.name, nights: 0, revenue: 0 }]));
  const bySource = new Map<string, { source: string; label: string; bookings: number; nights: number; revenue: number }>();
  const daily = new Map<string, { day: string; nights: number; revenue: number }>();
  for (let i = 0; i < days; i++) { const d = addDays(from, i); daily.set(d, { day: d, nights: 0, revenue: 0 }); }

  for (const s of stays) {
    const total = nightsBetween(s.checkIn, s.checkOut);
    if (total <= 0) continue;
    const perNight = s.total / total;
    const first = s.checkIn > from ? s.checkIn : from;
    const last = s.checkOut < end ? s.checkOut : end; // exclusive
    const n = nightsBetween(first, last);
    if (n <= 0) continue;
    for (let i = 0; i < n; i++) {
      const d = daily.get(addDays(first, i))!;
      d.nights += 1;
      d.revenue += perNight;
    }
    const apt = byApt.get(s.apartmentId) ?? { apartmentId: s.apartmentId, name: '(inactive apartment)', nights: 0, revenue: 0 };
    apt.nights += n;
    apt.revenue += perNight * n;
    byApt.set(s.apartmentId, apt);
    const src = bySource.get(s.source) ?? { source: s.source, label: SOURCE_LABEL[s.source] ?? s.source, bookings: 0, nights: 0, revenue: 0 };
    src.bookings += 1;
    src.nights += n;
    src.revenue += perNight * n;
    bySource.set(s.source, src);
  }

  const available = apts.length * days;
  const nightsSold = [...byApt.values()].reduce((n, a) => n + a.nights, 0);
  const roomRevenue = Math.round([...byApt.values()].reduce((n, a) => n + a.revenue, 0));

  const other = { orders: 0, extras: 0, cancellations: 0, adjustments: 0 };
  for (const c of charges) {
    const k = chargeKind(c);
    if (k) other[k] += c.amount;
  }

  const inRange = (d: string) => d >= from && d <= to;
  const eventRows = events.filter((e) => inRange(e.eventDate));
  const won = eventRows.filter((e) => e.stage === 'confirmed' || e.stage === 'deposit_paid');
  const eventStages = (['lead', 'quoted', 'deposit_paid', 'confirmed', 'lost'] as const).map((stage) => {
    const rows = eventRows.filter((e) => e.stage === stage);
    return { stage, count: rows.length, value: rows.reduce((n, e) => n + (e.quoteAmount ?? 0), 0) };
  });
  const eventDeposits = events
    .filter((e) => e.depositPaidAt && e.depositPaidAt >= fromTs && e.depositPaidAt < endTs)
    .reduce((n, e) => n + e.depositPaidAmount, 0);

  const payments = money.map((m) => ({
    method: m.method ?? 'other', label: METHOD_LABEL[m.method ?? ''] ?? 'Other',
    received: Number(m.payments), refunded: Number(m.refunds), net: Number(m.payments) - Number(m.refunds),
  })).sort((a, b) => b.net - a.net);
  const cashIn = payments.filter((p) => p.method !== 'ota').reduce((n, p) => n + p.net, 0);
  const expenseRows = spend.map((e) => ({ category: e.category, count: Number(e.count), amount: Number(e.amount) })).sort((a, b) => b.amount - a.amount);
  const totalExpenses = expenseRows.reduce((n, e) => n + e.amount, 0);

  const otherRevenue = other.orders + other.extras + other.cancellations + other.adjustments;
  const eventRevenue = won.reduce((n, e) => n + (e.quoteAmount ?? 0), 0);
  const rnd = (n: number) => Math.round(n);

  return {
    from, to, days,
    summary: {
      apartments: apts.length,
      available,
      nightsSold,
      occupancy: available ? nightsSold / available : 0,
      adr: nightsSold ? rnd(roomRevenue / nightsSold) : 0,
      revpar: available ? rnd(roomRevenue / available) : 0,
      roomRevenue,
      otherRevenue,
      eventRevenue,
      totalRevenue: roomRevenue + otherRevenue + eventRevenue,
      cashIn: cashIn + eventDeposits,
      expenses: totalExpenses,
      net: cashIn + eventDeposits - totalExpenses,
    },
    byApartment: [...byApt.values()].map((a) => ({
      ...a, revenue: rnd(a.revenue), occupancy: days ? a.nights / days : 0, adr: a.nights ? rnd(a.revenue / a.nights) : 0,
    })),
    bySource: [...bySource.values()].map((s) => ({ ...s, revenue: rnd(s.revenue), share: roomRevenue ? s.revenue / roomRevenue : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    other,
    events: { stages: eventStages, won: won.length, wonValue: eventRevenue, depositsReceived: eventDeposits },
    payments,
    expenses: expenseRows,
    daily: [...daily.values()].map((d) => ({ ...d, revenue: rnd(d.revenue), occupancy: apts.length ? d.nights / apts.length : 0 })),
  };
}

export type Report = Awaited<ReturnType<typeof report>>;

/* ── Excel ─────────────────────────────────────────────────────────────── */

const ghs = (p: number) => Math.round(p) / 100;
const pct = (f: number) => Math.round(f * 1000) / 10;

export function reportSheets(r: Report, siteName: string): Sheet[] {
  const s = r.summary;
  return [
    {
      name: 'Summary', widths: [34, 18],
      rows: [
        [`${siteName} — report`, `${r.from} to ${r.to}`],
        ['Apartments', s.apartments],
        ['Nights available', s.available],
        ['Nights sold', s.nightsSold],
        ['Occupancy %', pct(s.occupancy)],
        ['ADR (GH₵)', ghs(s.adr)],
        ['RevPAR (GH₵)', ghs(s.revpar)],
        ['Room revenue (GH₵)', ghs(s.roomRevenue)],
        ['Room orders (GH₵)', ghs(r.other.orders)],
        ['Extras (GH₵)', ghs(r.other.extras)],
        ['Cancellation fees (GH₵)', ghs(r.other.cancellations)],
        ['Adjustments (GH₵)', ghs(r.other.adjustments)],
        ['Events won — value (GH₵)', ghs(s.eventRevenue)],
        ['Total revenue (GH₵)', ghs(s.totalRevenue)],
        ['Cash received, net of refunds (GH₵)', ghs(s.cashIn)],
        ['Expenses (GH₵)', ghs(s.expenses)],
        ['Cash in less expenses (GH₵)', ghs(s.net)],
      ],
    },
    {
      name: 'By apartment', widths: [28, 12, 14, 18, 14],
      rows: [['Apartment', 'Nights sold', 'Occupancy %', 'Room revenue (GH₵)', 'ADR (GH₵)'],
        ...r.byApartment.map((a) => [a.name, a.nights, pct(a.occupancy), ghs(a.revenue), ghs(a.adr)])],
    },
    {
      name: 'By source', widths: [18, 12, 12, 18, 12],
      rows: [['Source', 'Bookings', 'Nights', 'Room revenue (GH₵)', 'Share %'],
        ...r.bySource.map((x) => [x.label, x.bookings, x.nights, ghs(x.revenue), pct(x.share)])],
    },
    {
      name: 'Events', widths: [16, 10, 18],
      rows: [['Stage', 'Events', 'Quoted value (GH₵)'], ...r.events.stages.map((e) => [e.stage.replace('_', ' '), e.count, ghs(e.value)]),
        [], ['Deposits received (GH₵)', null, ghs(r.events.depositsReceived)]],
    },
    {
      name: 'Payments', widths: [18, 16, 16, 16],
      rows: [['Method', 'Received (GH₵)', 'Refunded (GH₵)', 'Net (GH₵)'], ...r.payments.map((p) => [p.label, ghs(p.received), ghs(p.refunded), ghs(p.net)])],
    },
    {
      name: 'Expenses', widths: [24, 10, 16],
      rows: [['Category', 'Entries', 'Amount (GH₵)'], ...r.expenses.map((e) => [e.category, e.count, ghs(e.amount)])],
    },
    {
      name: 'Daily', widths: [12, 12, 14, 18],
      rows: [['Date', 'Nights sold', 'Occupancy %', 'Room revenue (GH₵)'], ...r.daily.map((d) => [d.day, d.nights, pct(d.occupancy), ghs(d.revenue)])],
    },
  ];
}
