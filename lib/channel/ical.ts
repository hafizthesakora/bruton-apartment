import { BookingError } from '@/lib/booking/engine';
import { isISODate } from '@/lib/booking/pricing';

export type CalendarEvent = { uid: string; checkIn: string; checkOut: string; cancelled: boolean };

/** Read non-recurring lodging events. DTEND is the exclusive checkout date (RFC 5545). */
export function parseCalendar(text: string): CalendarEvent[] {
  if (Buffer.byteLength(text) > 1_000_000) throw new BookingError(400, 'Calendar is too large');
  const lines = text.replace(/\r\n[ \t]|\n[ \t]/g, '').split(/\r?\n/).map((s) => s.trim());
  if (!lines.includes('BEGIN:VCALENDAR') || !lines.includes('END:VCALENDAR')) throw new BookingError(400, 'The URL did not return an iCalendar file');
  const result: CalendarEvent[] = [];
  let event: Record<string, string> | null = null;
  const date = (value = '') => {
    if (!/^\d{8}(T\d{6}Z?)?$/.test(value)) throw new BookingError(400, 'Calendar contains an unsupported date');
    const d = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    if (!isISODate(d)) throw new BookingError(400, 'Calendar contains an invalid date');
    return d;
  };
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { if (event) throw new BookingError(400, 'Invalid calendar'); event = {}; continue; }
    if (line === 'END:VEVENT') {
      if (!event?.UID || !event.DTSTART || !event.DTEND || event.RRULE || event['RECURRENCE-ID'] || event.RDATE || event.EXDATE) {
        throw new BookingError(400, 'Each calendar entry needs a UID, arrival and departure; recurring entries are not supported');
      }
      const checkIn = date(event.DTSTART), checkOut = date(event.DTEND);
      if (checkIn >= checkOut) throw new BookingError(400, 'Calendar departure must follow arrival');
      result.push({ uid: event.UID, checkIn, checkOut, cancelled: event.STATUS === 'CANCELLED' });
      if (result.length > 2000) throw new BookingError(400, 'Calendar has too many entries');
      event = null;
      continue;
    }
    if (event) {
      const colon = line.indexOf(':');
      if (colon > 0) event[line.slice(0, colon).split(';')[0].toUpperCase()] = line.slice(colon + 1);
    }
  }
  if (event || new Set(result.map((e) => e.uid)).size !== result.length) throw new BookingError(400, 'Calendar is incomplete or has duplicate entries');
  return result;
}

export function calendarText(events: { id: number; checkIn: string; checkOut: string }[], now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bruton Gardens//Availability//EN', 'CALSCALE:GREGORIAN',
    ...events.flatMap((e) => [
      'BEGIN:VEVENT', `UID:booking-${e.id}@brutongardens.local`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${e.checkIn.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${e.checkOut.replace(/-/g, '')}`,
      'SUMMARY:Unavailable', 'STATUS:CONFIRMED', 'END:VEVENT',
    ]), 'END:VCALENDAR', ''].join('\r\n');
}

const HOSTS: Record<string, string[]> = {
  airbnb: ['airbnb.com', 'airbnb.co.uk'], booking_com: ['booking.com'],
  vrbo: ['vrbo.com', 'homeaway.com'], expedia: ['expedia.com'],
};

/** Restrict server-side calendar requests to the selected channel's HTTPS hosts. */
export function calendarURL(input: string, source: string) {
  let url: URL;
  try { url = new URL(input); } catch { throw new BookingError(400, 'Enter a valid calendar URL'); }
  const allowed = HOSTS[source] ?? [];
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
    !allowed.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    throw new BookingError(400, 'Use the HTTPS iCalendar export URL from the selected booking channel');
  }
  return url.toString();
}

export async function fetchCalendar(url: string, source: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher(calendarURL(url, source), {
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { Accept: 'text/calendar' },
  });
  if (!response.ok || !response.body) throw new BookingError(502, `The booking channel returned HTTP ${response.status}`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_000_000) throw new BookingError(400, 'Calendar is too large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return parseCalendar(Buffer.concat(chunks).toString('utf8'));
}
