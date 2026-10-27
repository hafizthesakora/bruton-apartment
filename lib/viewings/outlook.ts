/**
 * Optional mirror of viewings onto Bruton's Outlook calendar (Microsoft Graph, app-only auth).
 * The database is the source of truth; this only keeps the calendar in step, so failures are
 * logged and never block a viewing. Guests are not added as attendees — they get our own
 * email + SMS instead of a second, Outlook-generated invite.
 */
import { eq } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { viewings } from '@/lib/db/schema';

export function outlookEnabled() {
  return !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.OUTLOOK_USER_EMAIL);
}

async function accessToken() {
  const res = await fetch(`https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token error: ${data.error_description || data.error}`);
  return data.access_token as string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const localISO = (d: Date) => d.toISOString().slice(0, 19); // Accra is UTC+0

function eventBody(v: typeof viewings.$inferSelect) {
  const label = v.type === 'virtual' ? 'Virtual Viewing' : 'Physical Viewing';
  return {
    subject: `Bruton Gardens - ${label} with ${v.name}`,
    body: {
      contentType: 'HTML',
      content: `<p><strong>${label}</strong></p><p>Name: ${esc(v.name)}<br>Phone: ${esc(v.phone)}<br>Email: ${esc(v.email)}</p><p>Notes: ${esc(v.notes || 'None')}</p>`,
    },
    start: { dateTime: localISO(v.scheduledAt), timeZone: 'Africa/Accra' },
    end: { dateTime: localISO(new Date(v.scheduledAt.getTime() + 3_600_000)), timeZone: 'Africa/Accra' },
    location: { displayName: v.type === 'physical' ? 'Bruton Gardens Apartment' : 'Virtual (link to be shared)' },
    isReminderOn: true,
    reminderMinutesBeforeStart: 30,
  };
}

/** Create, move or delete the Outlook event so it matches the viewing row. */
export async function syncViewingToOutlook(db: DB, viewingId: number) {
  if (!outlookEnabled()) return;
  try {
    const [v] = await db.select().from(viewings).where(eq(viewings.id, viewingId));
    if (!v) return;
    const live = v.status === 'requested' || v.status === 'confirmed';
    const base = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.OUTLOOK_USER_EMAIL!)}/events`;
    const headers = { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' };

    if (!live) {
      if (v.status === 'cancelled' && v.outlookEventId) {
        await fetch(`${base}/${v.outlookEventId}`, { method: 'DELETE', headers });
        await db.update(viewings).set({ outlookEventId: null }).where(eq(viewings.id, v.id));
      }
      return;
    }

    const res = await fetch(v.outlookEventId ? `${base}/${v.outlookEventId}` : base, {
      method: v.outlookEventId ? 'PATCH' : 'POST',
      headers,
      body: JSON.stringify(eventBody(v)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || `Graph ${res.status}`);
    if (!v.outlookEventId) await db.update(viewings).set({ outlookEventId: data.id }).where(eq(viewings.id, v.id));
  } catch (err) {
    console.error('[viewings] Outlook sync failed', viewingId, err);
  }
}
