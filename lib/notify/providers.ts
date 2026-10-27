/**
 * Delivery providers. Each returns 'skipped' rather than throwing when its key isn't set,
 * so bookings keep working before the accounts are ready.
 *   SMS   — Arkesel v2 (POST /api/v2/sms/send, `api-key` header)
 *   Email — Resend (free tier is plenty for one property)
 */
export type SendResult = { status: 'sent' | 'skipped' | 'failed'; provider: string; error?: string };

const ARKESEL_URL = 'https://sms.arkesel.com/api/v2/sms/send';
const RESEND_URL = 'https://api.resend.com/emails';

/** Arkesel wants international digits without '+': 0241234567 → 233241234567. Returns null if it can't be a phone number. */
export function normalizeGhanaPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = '233' + d.slice(1);
  if (d.length === 9 && /^[2-5]/.test(d)) d = '233' + d;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export async function sendSms(to: string, message: string): Promise<SendResult> {
  const provider = 'arkesel';
  const key = process.env.ARKESEL_API_KEY;
  if (!key) return { status: 'skipped', provider, error: 'ARKESEL_API_KEY not set' };
  try {
    const res = await fetch(ARKESEL_URL, {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Sender IDs are max 11 characters and must be approved in the Arkesel dashboard.
        sender: (process.env.ARKESEL_SENDER_ID || 'BrutonGdns').slice(0, 11),
        recipients: [to],
        message,
        ...(process.env.ARKESEL_SANDBOX === 'true' ? { sandbox: true } : {}),
      }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.status === 'success') return { status: 'sent', provider };
    return { status: 'failed', provider, error: body?.message || `HTTP ${res.status}` };
  } catch (err) {
    return { status: 'failed', provider, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const provider = 'resend';
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: 'skipped', provider, error: 'RESEND_API_KEY not set' };
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Bruton Gardens <bookings@brutongardens.com>',
        to: [to],
        subject,
        html,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      }),
    });
    if (res.ok) return { status: 'sent', provider };
    const body = await res.json().catch(() => null);
    return { status: 'failed', provider, error: body?.message || `HTTP ${res.status}` };
  } catch (err) {
    return { status: 'failed', provider, error: err instanceof Error ? err.message : String(err) };
  }
}
