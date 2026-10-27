/**
 * Rate calculation. Pure functions — no DB access — so the guest quote and the
 * server-side hold use exactly the same maths.
 * Dates are 'YYYY-MM-DD' strings; a stay is the half-open range [checkIn, checkOut).
 */
import type { ratePlans } from '@/lib/db/schema';

export type RatePlan = Pick<
  typeof ratePlans.$inferSelect,
  'baseRate' | 'weekendRate' | 'weekendDays' | 'longStayMinNights' | 'longStayDiscountPct' | 'minNights' | 'validFrom' | 'validTo' | 'active'
>;

export type NightLine = { date: string; rate: number; weekend: boolean };

export type Quote = {
  nights: number;
  lines: NightLine[];
  subtotal: number;
  discountPct: number;
  discount: number;
  total: number;
};

export type PaymentModeOption = 'full' | 'deposit' | 'pay_on_arrival';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function isISODate(s: string) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(date: string, n: number) {
  return new Date(Date.parse(date + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  return Math.round((Date.parse(checkOut + 'T00:00:00Z') - Date.parse(checkIn + 'T00:00:00Z')) / DAY_MS);
}

/** Today's date at the property (Ghana is UTC+0 year-round). */
export function todayAtProperty(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** The plan in force on a given night: a dated plan covering it beats an open-ended one. */
export function planForDate<P extends RatePlan>(plans: P[], date: string): P | undefined {
  const covering = plans.filter((p) =>
    p.active && (!p.validFrom || p.validFrom <= date) && (!p.validTo || date <= p.validTo));
  return covering.find((p) => p.validFrom || p.validTo) ?? covering[0];
}

export class QuoteError extends Error {}

export function quoteStay(plans: RatePlan[], checkIn: string, checkOut: string): Quote {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new QuoteError('Check-out must be after check-in');

  const first = planForDate(plans, checkIn);
  if (!first) throw new QuoteError('No rates set for these dates');
  if (nights < first.minNights) throw new QuoteError(`Minimum stay is ${first.minNights} nights`);

  const lines: NightLine[] = [];
  for (let i = 0; i < nights; i++) {
    const date = addDays(checkIn, i);
    const plan = planForDate(plans, date);
    if (!plan) throw new QuoteError('No rates set for these dates');
    const weekend = plan.weekendRate != null && plan.weekendDays.includes(new Date(date + 'T00:00:00Z').getUTCDay());
    lines.push({ date, weekend, rate: weekend ? plan.weekendRate! : plan.baseRate });
  }

  const subtotal = lines.reduce((s, l) => s + l.rate, 0);
  const discountPct = first.longStayMinNights && first.longStayDiscountPct && nights >= first.longStayMinNights
    ? first.longStayDiscountPct
    : 0;
  const discount = Math.round((subtotal * discountPct) / 100);
  return { nights, lines, subtotal, discountPct, discount, total: subtotal - discount };
}

export function amountDueNow(total: number, mode: PaymentModeOption, depositPct: number) {
  if (mode === 'full') return total;
  if (mode === 'deposit') return Math.round((total * depositPct) / 100);
  return 0;
}

/**
 * Which payment modes a guest may pick. Until Paystack is live, pay-on-arrival is the
 * fallback (plan §8 risk: "launch with pay-on-arrival / bank transfer").
 */
export function paymentOptions(
  policy: { allowDeposit: boolean; allowPayOnArrival: boolean },
  paystackEnabled: boolean,
): PaymentModeOption[] {
  const opts: PaymentModeOption[] = [];
  if (paystackEnabled) {
    opts.push('full');
    if (policy.allowDeposit) opts.push('deposit');
  }
  if (policy.allowPayOnArrival || !paystackEnabled) opts.push('pay_on_arrival');
  return opts;
}
