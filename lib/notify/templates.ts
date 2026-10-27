/**
 * Guest + staff message templates. Pure functions of the booking data.
 * SMS stays plain ASCII ("GHS", no em dashes or ₵): one non-GSM character switches the
 * whole message to Unicode and roughly triples the Arkesel cost.
 */
import { formatGHS } from '@/lib/money';

export type SiteInfo = {
  name: string;
  url: string;
  phone: string;
  directionsUrl: string;
  arrivalNote: string;
  reviewUrl: string;
  eventDepositInstructions: string;
};

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
  site: SiteInfo;
};

export type ViewingChange = 'booked' | 'rescheduled' | 'cancelled';

export type ViewingMessageData = {
  name: string;
  guestEmail: string | null;
  guestPhone: string | null;
  type: 'physical' | 'virtual';
  scheduledAt: Date;
  notes: string;
  site: SiteInfo;
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

function layout(d: { site: SiteInfo }, title: string, body: string) {
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

/* ── Viewings ──────────────────────────────────────────────────────────── */

// Ghana is UTC+0 all year, so UTC formatting is local time at the property.
const viewingWhen = (at: Date) =>
  at.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
const viewingWhenShort = (at: Date) =>
  at.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
const viewingLabel = (d: ViewingMessageData) => (d.type === 'virtual' ? 'virtual viewing' : 'viewing');

export function viewingEmail(d: ViewingMessageData, change: ViewingChange): EmailMessage {
  const when = viewingWhen(d.scheduledAt);
  const label = viewingLabel(d);
  if (change === 'cancelled') {
    return {
      subject: `Your ${label} has been cancelled · ${d.site.name}`,
      html: layout(d, `Your ${label} has been cancelled`, [
        p(`Hi ${esc(firstName(d.name))}, your ${label} on <strong>${esc(when)}</strong> has been cancelled.`),
        button(d.site.url, 'Book another time'),
        d.site.phone ? p(`Questions? Call or WhatsApp ${esc(d.site.phone)}.`) : '',
      ].join('')),
    };
  }
  const title = change === 'rescheduled' ? `Your ${label} has moved` : `Your ${label} is booked`;
  return {
    subject: `${title} · ${viewingWhenShort(d.scheduledAt)} · ${d.site.name}`,
    html: layout(d, title, [
      p(`Hi ${esc(firstName(d.name))}, ${change === 'rescheduled' ? 'your new time is' : 'we look forward to showing you around on'} <strong>${esc(when)}</strong>.`),
      d.type === 'virtual'
        ? p('We’ll send the video link to this email address before the call.')
        : p('The viewing takes about an hour. Please ask for the front desk when you arrive.'),
      d.type === 'physical' && d.site.directionsUrl ? button(d.site.directionsUrl, 'Get directions') : '',
      d.site.phone ? p(`Need to change the time? Call or WhatsApp ${esc(d.site.phone)}.`) : '',
    ].join('')),
  };
}

export function viewingSms(d: ViewingMessageData, change: ViewingChange) {
  const when = viewingWhenShort(d.scheduledAt);
  const label = viewingLabel(d);
  if (change === 'cancelled') {
    return `Bruton Gardens: your ${label} on ${when} has been cancelled.${d.site.phone ? ` Questions? ${d.site.phone}` : ''}`;
  }
  return [
    `Bruton Gardens: your ${label} is ${change === 'rescheduled' ? 'moved to' : 'booked for'} ${when}.`,
    d.type === 'physical' && d.site.directionsUrl ? `Directions: ${d.site.directionsUrl}` : '',
    d.type === 'virtual' ? 'We will send the video link by email.' : '',
    d.site.phone ? `To change: ${d.site.phone}` : '',
  ].filter(Boolean).join(' ');
}

export function staffNewViewingEmail(d: ViewingMessageData): EmailMessage {
  return {
    subject: `New ${viewingLabel(d)}: ${d.name}, ${viewingWhenShort(d.scheduledAt)}`,
    html: layout(d, `New ${viewingLabel(d)} request`, [
      rows([
        ['When', viewingWhen(d.scheduledAt), true],
        ['Type', d.type === 'virtual' ? 'Virtual viewing' : 'Physical viewing'],
        ['Name', d.name],
        ['Phone', d.guestPhone || '—'],
        ['Email', d.guestEmail || '—'],
      ]),
      d.notes ? p(`<strong>Notes:</strong> ${esc(d.notes)}`) : '',
      button(`${d.site.url}/admin/viewings`, 'Open viewings'),
    ].join('')),
  };
}

/* ── Event centre ──────────────────────────────────────────────────────── */

export type EventChange = 'received' | 'quoted' | 'deposit' | 'confirmed';

export type EventMessageData = {
  reference: string;
  name: string;
  guestEmail: string | null;
  guestPhone: string | null;
  eventType: string;
  eventDate: string;
  headcount: number;
  cateringRequired: boolean;
  quoteAmount: number | null;
  depositAmount: number | null;
  depositPaidAmount: number;
  quoteNotes: string;
  notes: string;
  site: SiteInfo;
};

function eventRows(d: EventMessageData, withMoney: boolean) {
  const balance = (d.quoteAmount ?? 0) - d.depositPaidAmount;
  return rows([
    ['Reference', d.reference, true],
    ['Event', d.eventType],
    ['Date', longDate(d.eventDate)],
    ['Guests', String(d.headcount)],
    ...(withMoney && d.quoteAmount != null ? [
      ['Quote', formatGHS(d.quoteAmount)] as [string, string],
      ...(d.depositAmount ? [['Deposit to secure the date', formatGHS(d.depositAmount)] as [string, string]] : []),
      ...(d.depositPaidAmount > 0 ? [['Deposit paid', formatGHS(d.depositPaidAmount)] as [string, string]] : []),
      ...(d.depositPaidAmount > 0 && balance > 0 ? [['Balance', formatGHS(balance), true] as [string, string, boolean]] : []),
    ] : []),
  ]);
}

const helpLine = (d: EventMessageData) =>
  d.site.phone ? p(`Questions? Call or WhatsApp us on ${esc(d.site.phone)}.`) : '';

export function eventEmail(d: EventMessageData, change: EventChange): EmailMessage {
  const first = esc(firstName(d.name));
  switch (change) {
    case 'received':
      return {
        subject: `We’ve received your event enquiry · ${d.reference} · ${d.site.name}`,
        html: layout(d, 'Thanks for your enquiry', [
          p(`Hi ${first}, thank you for considering ${esc(d.site.name)} for your ${esc(d.eventType.toLowerCase())}. Our events team will be in touch shortly with a quote.`),
          eventRows(d, false),
          helpLine(d),
        ].join('')),
      };
    case 'quoted':
      return {
        subject: `Your event quote · ${d.reference} · ${d.site.name}`,
        html: layout(d, 'Your event quote', [
          p(`Hi ${first}, here is our quote for your ${esc(d.eventType.toLowerCase())}.`),
          eventRows(d, true),
          d.quoteNotes ? p(`<strong>What’s included</strong><br>${esc(d.quoteNotes).replace(/\n/g, '<br>')}`) : '',
          d.depositAmount
            ? p(`To secure ${esc(longDate(d.eventDate))}, please pay the deposit of <strong>${esc(formatGHS(d.depositAmount))}</strong>. The date is only held once the deposit is received.`)
            : '',
          d.site.eventDepositInstructions ? p(esc(d.site.eventDepositInstructions).replace(/\n/g, '<br>')) : '',
          p(`Please quote <strong>${esc(d.reference)}</strong> with your payment.`),
          helpLine(d),
        ].join('')),
      };
    case 'deposit':
      return {
        subject: `Deposit received · ${d.reference} · ${d.site.name}`,
        html: layout(d, 'Deposit received — your date is held', [
          p(`Hi ${first}, we’ve received your deposit. Thank you!`),
          eventRows(d, true),
          p('We’ll be in touch to confirm the final arrangements.'),
          helpLine(d),
        ].join('')),
      };
    case 'confirmed':
      return {
        subject: `Your event is confirmed · ${d.reference} · ${d.site.name}`,
        html: layout(d, 'Your event is confirmed', [
          p(`Hi ${first}, everything is set for your ${esc(d.eventType.toLowerCase())}. We look forward to hosting you.`),
          eventRows(d, true),
          d.site.directionsUrl ? button(d.site.directionsUrl, 'Get directions') : '',
          helpLine(d),
        ].join('')),
      };
  }
}

export function eventSms(d: EventMessageData, change: EventChange) {
  const date = shortDate(d.eventDate);
  const help = d.site.phone ? ` Questions? ${d.site.phone}` : '';
  switch (change) {
    case 'received':
      return `Bruton Gardens: thanks for your event enquiry (${d.reference}) for ${date}. We will send you a quote shortly.${help}`;
    case 'quoted':
      return [
        `Bruton Gardens: your event quote (${d.reference}) is ${smsMoney(d.quoteAmount ?? 0)}.`,
        d.depositAmount ? `Pay a ${smsMoney(d.depositAmount)} deposit to secure ${date}.` : '',
        d.guestEmail ? 'Details sent to your email.' : '',
      ].filter(Boolean).join(' ') + help;
    case 'deposit':
      return `Bruton Gardens: deposit of ${smsMoney(d.depositPaidAmount)} received for ${d.reference}. Your date (${date}) is held. Thank you!`;
    case 'confirmed':
      return `Bruton Gardens: your event on ${date} (${d.reference}) is confirmed. We look forward to hosting you!${help}`;
  }
}

export function staffNewEventEmail(d: EventMessageData): EmailMessage {
  return {
    subject: `New event enquiry: ${d.eventType}, ${shortDate(d.eventDate)}, ${d.headcount} guests`,
    html: layout(d, 'New event enquiry', [
      rows([
        ['Reference', d.reference, true],
        ['Event', d.eventType],
        ['Date', longDate(d.eventDate)],
        ['Guests', String(d.headcount)],
        ['Catering', d.cateringRequired ? 'Wanted' : 'Not requested'],
        ['Name', d.name],
        ['Phone', d.guestPhone || '—'],
        ['Email', d.guestEmail || '—'],
      ]),
      d.notes ? p(`<strong>Notes:</strong> ${esc(d.notes)}`) : '',
      button(`${d.site.url}/admin/events`, 'Open events'),
    ].join('')),
  };
}

/* ── Booking changes (staff) ───────────────────────────────────────────── */

export function bookingChangedEmail(d: BookingMessageData): EmailMessage {
  return {
    subject: `Your booking has been updated · ${d.reference} · ${d.site.name}`,
    html: layout(d, 'Your booking has been updated', [
      p(`Hi ${esc(firstName(d.guestName))}, here are your updated booking details.`),
      stayRows(d),
      button(bookingUrl(d), 'View your booking'),
      d.site.phone ? p(`Questions? Call or WhatsApp ${esc(d.site.phone)}.`) : '',
    ].join('')),
  };
}

export function bookingChangedSms(d: BookingMessageData) {
  return `Bruton Gardens: booking ${d.reference} updated. ${d.apartmentName}, ${shortDate(d.checkIn)} - ${shortDate(d.checkOut)} (${d.nights} night${d.nights === 1 ? '' : 's'}). Total ${smsMoney(d.total)}.`;
}

export function bookingCancelledEmail(d: BookingMessageData): EmailMessage {
  return {
    subject: `Booking cancelled · ${d.reference} · ${d.site.name}`,
    html: layout(d, 'Your booking has been cancelled', [
      p(`Hi ${esc(firstName(d.guestName))}, your booking ${esc(d.reference)} for ${esc(longDate(d.checkIn))} – ${esc(longDate(d.checkOut))} has been cancelled.`),
      d.paid > 0 ? p('Our front desk will contact you about the payment you made.') : '',
      button(`${d.site.url}/book`, 'Book again'),
      d.site.phone ? p(`Questions? Call or WhatsApp ${esc(d.site.phone)}.`) : '',
    ].join('')),
  };
}

export function bookingCancelledSms(d: BookingMessageData) {
  return `Bruton Gardens: booking ${d.reference} (${shortDate(d.checkIn)} - ${shortDate(d.checkOut)}) has been cancelled.${d.site.phone ? ` Questions? ${d.site.phone}` : ''}`;
}
