import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { createHold, releaseHold, startPayment } from '@/lib/booking/engine';
import { publicRoute } from '@/lib/booking/http';
import { initializeTransaction, paystackEnabled } from '@/lib/payments/paystack';

export const dynamic = 'force-dynamic';

const body = z.object({
  apartmentId: z.number().int(),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20).default(0),
  paymentMode: z.enum(['full', 'deposit', 'pay_on_arrival']),
  guest: z.object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(120),
    email: z.email('Enter a valid email').max(200),
    phone: z.string().trim().min(7, 'Enter a valid phone number').max(32),
  }),
  notes: z.string().max(1000).optional(),
});

/**
 * Hold the apartment, then either confirm (pay on arrival) or send the guest to Paystack.
 * The booking is only confirmed by the Paystack webhook, never by the redirect back.
 */
export const POST = publicRoute(async (request) => {
  const input = body.parse(await request.json());
  const db = await getDb();
  const online = paystackEnabled();
  const { booking } = await createHold(db, input, { paystackEnabled: online });

  if (booking.status === 'confirmed' || booking.amountDueNow === 0) {
    return NextResponse.json({ reference: booking.reference, status: booking.status });
  }

  const { intent } = await startPayment(db, booking.id, 'paystack');
  const origin = process.env.SITE_URL || new URL(request.url).origin;
  try {
    const { authorizationUrl } = await initializeTransaction({
      email: input.guest.email,
      amount: intent.amount,
      reference: intent.reference,
      callbackUrl: `${origin}/book/${booking.reference}`,
      metadata: { bookingReference: booking.reference },
    });
    return NextResponse.json({ reference: booking.reference, status: 'pending_payment', authorizationUrl });
  } catch (err) {
    console.error('[booking] Paystack initialize failed', err);
    await releaseHold(db, booking.id);
    return NextResponse.json({ error: 'We couldn’t reach the payment provider. Please try again in a moment.' }, { status: 502 });
  }
});
