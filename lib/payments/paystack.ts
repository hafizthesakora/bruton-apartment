/**
 * Paystack (MoMo + card, GHS). Amounts are in pesewas, which is Paystack's subunit for GHS.
 * Card data never touches our servers: the guest pays on Paystack's hosted checkout and we
 * only trust the signed charge.success webhook (plan §3 step 3).
 */
import crypto from 'crypto';

const API = 'https://api.paystack.co';

export function paystackEnabled() {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

export async function initializeTransaction(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorizationUrl: string; accessCode: string }> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: 'GHS',
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: ['mobile_money', 'card'],
      metadata: input.metadata,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack initialize failed: ${body?.message ?? res.status}`);
  }
  return { authorizationUrl: body.data.authorization_url, accessCode: body.data.access_code };
}

/** x-paystack-signature is HMAC-SHA512 of the raw request body, keyed with the secret key. */
export function verifySignature(rawBody: string, signature: string | null, key = process.env.PAYSTACK_SECRET_KEY) {
  if (!signature || !key) return false;
  const expected = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type PaystackEvent = {
  event: string;
  data: { reference: string; amount: number; currency: string; status: string; channel?: string; [k: string]: unknown };
};
