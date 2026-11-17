import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { updateJSON } from '@/lib/data';
import { errorResponse } from '@/lib/auth/staff';
import { sendEmail } from '@/lib/notify/providers';

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email('Enter a valid email address').max(200),
  phone: z.string().trim().max(32).optional().default(''),
  country: z.string().trim().max(100).optional().default(''),
  message: z.string().trim().min(1).max(5000),
});

const escapeHTML = (value) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

async function saveEnquiry(input) {
  await updateJSON('enquiries.json', (enquiries) => [{
    ...input, id: randomUUID(), read: false, createdAt: new Date().toISOString(),
  }, ...(enquiries || [])]);
}

async function notifyWithFallback(input, recipient) {
  if (!recipient) return;
  const details = Object.entries(input).map(([key, value]) =>
    `<p><strong>${escapeHTML(key)}:</strong> ${escapeHTML(value).replace(/\n/g, '<br>')}</p>`,
  ).join('');
  const result = await sendEmail(recipient, `New Enquiry from ${input.name} — Bruton Gardens Website`, details);
  if (result.status !== 'sent') console.error('[contact] enquiry saved; fallback notification unavailable', result.status);
}

async function getAccessToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(10000),
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Token error: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

export async function POST(request) {
  try {
    const input = enquirySchema.parse(await request.json());
    // Persist before delivery: the team can read the enquiry even if Outlook is unavailable.
    await saveEnquiry(input);
    const success = () => NextResponse.json({
      success: true, message: 'Your message has been received by our team.',
    });
    const outlookUser = process.env.OUTLOOK_USER_EMAIL;
    if (!outlookUser || !process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
      await notifyWithFallback(input, outlookUser || process.env.EMAIL_REPLY_TO || process.env.GMAIL_USER);
      return success();
    }

    try {
      const { name, email, phone, country, message } = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [key, escapeHTML(value)]),
      );
      const accessToken = await getAccessToken();

      // Send email to Bruton's inbox from info@brutongardens.com
      const mailPayload = {
        message: {
          subject: `New Enquiry from ${name} — Bruton Gardens Website`,
          body: {
            contentType: 'HTML',
            content: `
              <h2>New Contact Enquiry</h2>
              <table style="border-collapse:collapse;font-family:Arial,sans-serif;">
                <tr><td style="padding:8px;font-weight:bold;">Name:</td><td style="padding:8px;">${name}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Phone:</td><td style="padding:8px;">${phone || 'Not provided'}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Country:</td><td style="padding:8px;">${country || 'Not provided'}</td></tr>
              </table>
              <h3>Message:</h3>
              <p style="background:#f5f5f5;padding:16px;border-radius:8px;">${message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p style="color:#888;font-size:12px;">Sent from Bruton Gardens & Apartments website contact form</p>
            `,
          },
          toRecipients: [
            {
              emailAddress: {
                address: outlookUser,
                name: 'Bruton Gardens',
              },
            },
          ],
          replyTo: [
            {
              emailAddress: {
                address: input.email,
                name: input.name,
              },
            },
          ],
        },
        saveToSentItems: true,
      };

      const graphUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(outlookUser)}/sendMail`;

      const response = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailPayload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Graph Mail error:', data);
        throw new Error(data.error?.message || 'Failed to send email');
      }

    } catch (error) {
      console.error('[contact] enquiry saved; Outlook notification failed', error);
      await notifyWithFallback(input, outlookUser);
    }
    return success();
  } catch (error) {
    return errorResponse(error);
  }
}
