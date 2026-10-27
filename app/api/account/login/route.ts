import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { BookingError } from '@/lib/booking/engine';
import { requestCode } from '@/lib/account';
import { loadSite } from '@/lib/notify';
import { normalizeGhanaPhone, sendEmail, sendSms } from '@/lib/notify/providers';
import { loginCodeEmail, loginCodeSms } from '@/lib/notify/templates';

export const dynamic = 'force-dynamic';

// Same answer whether or not we know the contact, so the form can't be used to find guests.
const SENT = { ok: true, message: 'If that matches a booking, we’ve sent a 6-digit code. It can take a minute to arrive.' };

/**
 * Send a sign-in code by SMS or email. Codes go straight to the provider (not the outbox),
 * so the plain code is never stored. Without a provider key in development, it's logged.
 */
export const POST = publicRoute(async (request) => {
  const { contact } = z.object({ contact: z.string().trim().min(3, 'Enter the email or phone number you booked with').max(150) }).parse(await request.json());
  const db = await getDb();
  let issued;
  try {
    issued = await requestCode(db, contact);
  } catch (err) {
    // Rate-limited: answer as usual rather than reveal the contact exists.
    if (err instanceof BookingError && err.status === 429) return NextResponse.json(SENT);
    throw err;
  }
  if (!issued) return NextResponse.json(SENT);

  const { site } = await loadSite(db);
  const result = issued.channel === 'email'
    ? await sendEmail(issued.key.slice(2), loginCodeEmail(site, issued.code).subject, loginCodeEmail(site, issued.code).html)
    : await sendSms(normalizeGhanaPhone(contact) ?? contact, loginCodeSms(site, issued.code));
  if (result.status !== 'sent') {
    if (process.env.NODE_ENV !== 'production') console.log(`[account] sign-in code for ${issued.key}: ${issued.code} (${result.error ?? result.status})`);
    else console.error('[account] could not send sign-in code', issued.channel, result.error);
  }
  return NextResponse.json(SENT);
});
