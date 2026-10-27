import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { applySuccessfulCharge } from '@/lib/booking/engine';
import { verifySignature, type PaystackEvent } from '@/lib/payments/paystack';

export const dynamic = 'force-dynamic';

/**
 * Paystack webhook. Set the URL in the Paystack dashboard to
 *   https://brutongardens.com/api/payments/paystack/webhook
 * Anything other than a 200 makes Paystack retry, so only fail when we want a retry.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(raw) as PaystackEvent;
  if (event.event !== 'charge.success' || event.data?.status !== 'success') {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const { reference, amount, currency, channel } = event.data;
  const outcome = await applySuccessfulCharge(await getDb(), { reference, amount, currency, channel, raw: event.data });
  if (outcome !== 'confirmed' && outcome !== 'duplicate') console.warn('[paystack] charge', reference, outcome);
  return NextResponse.json({ ok: true, outcome });
}
