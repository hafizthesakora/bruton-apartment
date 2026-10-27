import { describe, it, expect } from 'vitest';
import { quoteStay, amountDueNow, paymentOptions, planForDate, QuoteError, type RatePlan } from '@/lib/booking/pricing';

const plan = (o: Partial<RatePlan> = {}): RatePlan => ({
  baseRate: 10000, weekendRate: 12000, weekendDays: [5, 6], longStayMinNights: 7, longStayDiscountPct: 10,
  minNights: 1, validFrom: null, validTo: null, active: true, ...o,
});

describe('quoteStay', () => {
  it('charges weekend rate on Fri and Sat nights only', () => {
    // 2027-01-07 is a Thursday: Thu, Fri, Sat nights
    const q = quoteStay([plan()], '2027-01-07', '2027-01-10');
    expect(q.lines.map((l) => l.rate)).toEqual([10000, 12000, 12000]);
    expect(q.total).toBe(34000);
  });

  it('applies the long-stay discount from the minimum nights', () => {
    const q = quoteStay([plan({ weekendRate: null })], '2027-01-04', '2027-01-11');
    expect(q.nights).toBe(7);
    expect(q.subtotal).toBe(70000);
    expect(q.discount).toBe(7000);
    expect(q.total).toBe(63000);
    expect(quoteStay([plan({ weekendRate: null })], '2027-01-04', '2027-01-10').discount).toBe(0);
  });

  it('enforces minimum nights', () => {
    expect(() => quoteStay([plan({ minNights: 2 })], '2027-01-04', '2027-01-05')).toThrow(QuoteError);
  });

  it('prefers a dated seasonal plan over the open-ended one', () => {
    const plans = [plan(), plan({ baseRate: 20000, weekendRate: null, validFrom: '2027-12-20', validTo: '2027-12-31' })];
    expect(planForDate(plans, '2027-12-24')?.baseRate).toBe(20000);
    const q = quoteStay(plans, '2027-12-31', '2028-01-02'); // Fri 31 Dec (seasonal), Sat 1 Jan (standard weekend)
    expect(q.lines.map((l) => l.rate)).toEqual([20000, 12000]);
  });

  it('rejects empty stays and missing rates', () => {
    expect(() => quoteStay([plan()], '2027-01-05', '2027-01-05')).toThrow(QuoteError);
    expect(() => quoteStay([plan({ active: false })], '2027-01-05', '2027-01-06')).toThrow(QuoteError);
  });
});

describe('payments', () => {
  it('computes amount due now per mode', () => {
    expect(amountDueNow(10001, 'full', 50)).toBe(10001);
    expect(amountDueNow(10001, 'deposit', 50)).toBe(5001);
    expect(amountDueNow(10001, 'pay_on_arrival', 50)).toBe(0);
  });

  it('falls back to pay-on-arrival until Paystack is live', () => {
    const policy = { allowDeposit: true, allowPayOnArrival: false };
    expect(paymentOptions(policy, false)).toEqual(['pay_on_arrival']);
    expect(paymentOptions(policy, true)).toEqual(['full', 'deposit']);
    expect(paymentOptions({ ...policy, allowPayOnArrival: true }, true)).toEqual(['full', 'deposit', 'pay_on_arrival']);
  });
});
