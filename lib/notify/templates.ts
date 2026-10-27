/**
 * Guest + staff message templates. Pure functions of the booking data.
 * SMS stays plain ASCII ("GHS", no em dashes or ₵): one non-GSM character switches the
 * whole message to Unicode and roughly triples the Arkesel cost.
 */
import { formatGHS } from '@/lib/money';

export type BookingMessageData = {
  reference: string;
  guestName: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  paid: number;
  paymentMode: 'full' | 'deposit' | 'pay_on_arrival';
  source: string;
  notes: string;
  guestEmail: string | null;
  guestPhone: string | null;
  checkInTime: string;
  checkOutTime: string;
  cancellationText: string;
  site: {
    name: string;
    url: string;
    phone: string;
    directionsUrl: string;
    arrivalNote: string;
    reviewUrl: string;
  };
};

export type EmailMessage = { subject: string; html: string };

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const longDate = (d: string) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortDate = (d: string) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const smsMoney = (p: number) => `GHS ${(p / 100).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const firstName = (n: string) => n.trim().split(/\s+/)[0] || 'there';
const bookingUrl = (d: BookingMessageData) => `${d.site.url}/book/${d.reference}`;

/* ── Email shell ───────────────────────────────────────────────────────── */

function layout(d: BookingMessageData, title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f5fa;font-family:Helvetica,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fa;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0f172a;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">${esc(d.site.name)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;background:#f9fafb;color:#6b7280;font-size:12px">
${esc(d.site.name)}${d.site.phone ? ` · ${esc(d.site.phone)}` : ''} · <a href="${esc(d.site.url)}" style="color:#4d7c0f">${esc(d.site.url.replace(/^https?:\/\//, ''))}</a>
</td></tr></table></td></tr></table></body></html>`;
}

const p = (text: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5">${text}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${esc(href)}" style="display:inline-block;background:#a3e635;color:#111827;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${esc(label)}</a></p>`;

function rows(items: [string, string, boolean?][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:16px;margin:0 0 16px;font-size:14px">
${items.map(([k, v, bold]) => `<tr><td style="padding:4px 0;color:#6b7280">${esc(k)}</td><td align="right" style="padding:4px 0;${bold ? 'font-weight:bold' : ''}">${esc(v)}</td></tr>`).join('')}
</table>`;
}

function stayRows(d: BookingMessageData) {
  const balance = d.total - d.paid;
  return rows([
    ['Reference', d.reference, true],
    ['Apartment', d.apartmentName],
    ['Check-in', `${longDate(d.checkIn)}, from ${d.checkInTime}`],
    ['Check-out', `${longDate(d.checkOut)}, by ${d.checkOutTime}`],
    ['Stay', `${d.guests} guest${d.guests === 1 ? '' : 's'} · ${d.nights} night${d.nights === 1 ? '' : 's'}`],
    ['Total', formatGHS(d.total)],
    ...(d.paid > 0 ? [['Paid', formatGHS(d.paid)] as [string, string]] : []),
    ...(balance > 0 ? [['Due at check-in', formatGHS(balance), true] as [string, string, boolean]] : []),
  ]);
}

/* ── Templates ─────────────────────────────────────────────────────────── */

export function bookingConfirmedEmail(d: BookingMessageData): EmailMessage {
  return {
    subject: `Booking confirmed · ${d.reference} · ${d.site.name}`,
    html: layout(d, `You’re booked, ${firstName(d.guestName)}!`, [
      p(`Thank you for booking with us. Here are your details — please keep your reference for check-in.`),
      stayRows(d),
      d.cancellationText ? p(`<span style="color:#6b7280;font-size:13px">${esc(d.cancellationText)}</span>`) : '',
      button(bookingUrl(d), 'View your booking'),
      p(`We’ll send directions and check-in details the day before you arrive.${d.site.phone ? ` Questions? Call or WhatsApp us on ${esc(d.site.phone)}.` : ''}`),
    ].join('')),
  };
}

export function bookingConfirmedSms(d: BookingMessageData) {
  const balance = d.total - d.paid;
  return [
    `Bruton Gardens: booking ${d.reference} confirmed.`,
    `${d.apartmentName}, ${shortDate(d.checkIn)} - ${shortDate(d.checkOut)} (${d.nights} night${d.nights === 1 ? '' : 's'}).`,
    d.paid > 0 ? `Paid ${smsMoney(d.paid)}.` : '',
    balance > 0 ? `${smsMoney(balance)} due at check-in.` : '',
    `Check-in from ${d.checkInTime}.`,
  ].filter(Boolean).join(' ');
}

export function paymentReceiptEmail(d: BookingMessageData, payment: { amount: number; method: string; reference: string }): EmailMessage {
  return {
    subject: `Payment received · ${d.reference} · ${d.site.name}`,
    html: layout(d, 'Payment received', [
      p(`Hi ${esc(firstName(d.guestName))}, we’ve received your payment. Thank you!`),
      rows([
        ['Amount', formatGHS(payment.amount), true],
        ['Method', payment.method],
        ['Payment reference', payment.reference],
        ['Date', longDate(new Date().toISOString().slice(0, 10))],
      ]),
      stayRows(d),
      button(bookingUrl(d), 'View your booking'),
    ].join('')),
  };
}

export function preArrivalEmail(d: BookingMessageData): EmailMessage {
  return {
    subject: `See you tomorrow · ${d.reference} · ${d.site.name}`,
    html: layout(d, `See you tomorrow, ${firstName(d.guestName)}!`, [
      p(`Your apartment will be ready from <strong>${esc(d.checkInTime)}</strong> on ${esc(longDate(d.checkIn))}. Please bring a valid ID for check-in.`),
      d.site.arrivalNote ? p(esc(d.site.arrivalNote).replace(/\n/g, '<br>')) : '',
      d.site.directionsUrl ? button(d.site.directionsUrl, 'Get directions') : '',
      stayRows(d),
      d.site.phone ? p(`Running late or need help finding us? Call or WhatsApp ${esc(d.site.phone)}.`) : '',
    ].join('')),
  };
}

export function preArrivalSms(d: BookingMessageData) {
  return [
    `Bruton Gardens: see you tomorrow! Check-in from ${d.checkInTime}, ref ${d.reference}. Please bring a valid ID.`,
    d.site.directionsUrl ? `Directions: ${d.site.directionsUrl}` : '',
    d.site.phone ? `Help: ${d.site.phone}` : '',
  ].filter(Boolean).join(' ');
}

export function reviewRequestEmail(d: BookingMessageData): EmailMessage {
  return {
    subject: `How was your stay at ${d.site.name}?`,
    html: layout(d, `Thanks for staying with us, ${firstName(d.guestName)}`, [
      p(`We hope you enjoyed ${esc(d.apartmentName)}. If you have a minute, a short review helps other guests find us — and tells us what to keep doing (or fix).`),
      button(d.site.reviewUrl, 'Leave a review'),
      p(`We’d love to welcome you back.`),
    ].join('')),
  };
}

export function staffNewBookingEmail(d: BookingMessageData): EmailMessage {
  const balance = d.total - d.paid;
  return {
    subject: `New booking ${d.reference}: ${d.apartmentName}, ${shortDate(d.checkIn)} – ${shortDate(d.checkOut)}`,
    html: layout(d, 'New booking', [
      rows([
        ['Reference', d.reference, true],
        ['Guest', d.guestName],
        ['Phone', d.guestPhone || '—'],
        ['Email', d.guestEmail || '—'],
        ['Apartment', d.apartmentName],
        ['Dates', `${longDate(d.checkIn)} → ${longDate(d.checkOut)}`],
        ['Guests', String(d.guests)],
        ['Source', d.source.replace('_', ' ')],
        ['Payment', d.paymentMode.replace(/_/g, ' ')],
        ['Total', formatGHS(d.total)],
        ['Paid', formatGHS(d.paid)],
        ['Balance', formatGHS(balance), balance > 0],
      ]),
      d.notes ? p(`<strong>Guest notes:</strong> ${esc(d.notes)}`) : '',
    ].join('')),
  };
}
