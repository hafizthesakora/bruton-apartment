import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { auditLog, notifications, siteContent } from '@/lib/db/schema';
import {
  createEventLead, sendQuote, recordDeposit, confirmEvent, markLost, reopenLead, updateDetails, listEventLeads, bookedOnDate,
  type EnquiryInput,
} from '@/lib/events';
import type { DB } from '@/lib/db';

let db: DB;
const NOW = new Date('2027-03-01T10:00:00Z');
const STAFF = { id: 1, name: 'Manager' };

const enquire = (o: Partial<EnquiryInput> = {}, source?: 'website' | 'phone') => createEventLead(db, {
  name: 'Abena Asante', phone: '020 765 4321', email: 'abena@example.com', eventDate: '2027-04-17',
  eventType: 'Wedding / reception', headcount: 150, cateringRequired: true, ...o,
}, { now: NOW, source, actor: source ? STAFF : undefined });

const msgs = (id: number) => db.select().from(notifications).where(eq(notifications.eventLeadId, id));
const templates = async (id: number) => (await msgs(id)).map((m) => `${m.template}:${m.channel}`).sort();

beforeAll(async () => {
  db = await testDb();
  await db.insert(siteContent).values({
    key: 'settings.json',
    data: { recipientEmail: 'events@example.com', guestMessages: { phone: '+233 24 000 0000', eventDepositInstructions: 'MoMo 024 000 0000' } },
  });
});

describe('enquiry', () => {
  it('creates a lead with a reference and messages the client + staff', async () => {
    const lead = await enquire();
    expect(lead).toMatchObject({ stage: 'lead', source: 'website', cateringRequired: true });
    expect(lead.reference).toMatch(/^EV[A-Z0-9]{6}$/);
    expect(await templates(lead.id)).toEqual(['event_received:email', 'event_received:sms', 'staff_new_event:email']);
  });

  it('staff-entered leads send nothing', async () => {
    const lead = await enquire({ email: '' }, 'phone');
    expect(lead.email).toBeNull();
    expect(await msgs(lead.id)).toHaveLength(0);
  });

  it('rejects past dates', async () => {
    await expect(enquire({ eventDate: '2027-02-01' })).rejects.toMatchObject({ status: 400 });
  });
});

describe('pipeline', () => {
  it('lead → quoted → deposit_paid → confirmed, messaging at each step', async () => {
    const lead = await enquire({ eventDate: '2027-05-08' });
    const q = await sendQuote(db, lead.id, { quoteAmount: 1_500_000, depositAmount: 500_000, quoteNotes: 'Hall hire, chairs, PA' }, STAFF, NOW);
    expect(q).toMatchObject({ stage: 'quoted', quoteAmount: 1_500_000 });
    const quoteEmail = (await msgs(lead.id)).find((m) => m.template === 'event_quoted' && m.channel === 'email')!;
    expect(quoteEmail.body).toContain('GH₵ 15,000.00');
    expect(quoteEmail.body).toContain('MoMo 024 000 0000');
    expect(quoteEmail.body).toContain(lead.reference);
    const quoteSms = (await msgs(lead.id)).find((m) => m.template === 'event_quoted' && m.channel === 'sms')!;
    expect(quoteSms.body).toMatch(/^[\x20-\x7E]*$/);
    expect(quoteSms.body).toContain('GHS 15,000');

    const d = await recordDeposit(db, lead.id, { amount: 500_000, method: 'momo', reference: 'MP123' }, STAFF, NOW);
    expect(d).toMatchObject({ stage: 'deposit_paid', depositPaidAmount: 500_000, depositMethod: 'momo' });
    expect(await bookedOnDate(db, '2027-05-08')).toHaveLength(1);

    const c = await confirmEvent(db, lead.id, STAFF, NOW);
    expect(c.stage).toBe('confirmed');

    // a later balance payment adds up and keeps the stage
    const bal = await recordDeposit(db, lead.id, { amount: 1_000_000, method: 'cash' }, STAFF, NOW);
    expect(bal).toMatchObject({ stage: 'confirmed', depositPaidAmount: 1_500_000 });

    expect((await templates(lead.id)).filter((t) => !t.startsWith('event_received') && !t.startsWith('staff'))).toEqual([
      'event_confirmed:email', 'event_confirmed:sms',
      'event_deposit:email', 'event_deposit:email', 'event_deposit:sms', 'event_deposit:sms',
      'event_quoted:email', 'event_quoted:sms',
    ]);
    const actions = (await db.select().from(auditLog).where(eq(auditLog.entityId, String(lead.id)))).filter((a) => a.entity === 'event').map((a) => a.action);
    expect(actions).toEqual(['create', 'quote', 'payment', 'confirm', 'payment']);
  });

  it('guards invalid transitions and amounts', async () => {
    const lead = await enquire({ eventDate: '2027-05-15' });
    await expect(recordDeposit(db, lead.id, { amount: 100, method: 'cash' }, STAFF, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(confirmEvent(db, lead.id, STAFF, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(sendQuote(db, lead.id, { quoteAmount: 100, depositAmount: 200 }, STAFF, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(sendQuote(db, lead.id, { quoteAmount: 0, depositAmount: 0 }, STAFF, NOW)).rejects.toMatchObject({ status: 400 });
  });

  it('lost leads can be re-opened where they left off', async () => {
    const lead = await enquire({ eventDate: '2027-05-22' });
    await sendQuote(db, lead.id, { quoteAmount: 800_000, depositAmount: 0 }, STAFF, NOW);
    const lost = await markLost(db, lead.id, 'Went with another venue', STAFF, NOW);
    expect(lost).toMatchObject({ stage: 'lost', lostReason: 'Went with another venue' });
    expect((await reopenLead(db, lead.id, STAFF, NOW)).stage).toBe('quoted');
  });

  it('flags date clashes with events that hold the date', async () => {
    const a = await enquire({ eventDate: '2027-06-05' });
    await sendQuote(db, a.id, { quoteAmount: 100_000, depositAmount: 50_000 }, STAFF, NOW);
    await recordDeposit(db, a.id, { amount: 50_000, method: 'transfer' }, STAFF, NOW);
    const b = await enquire({ eventDate: '2027-06-05', name: 'Second' });
    const rows = await listEventLeads(db, NOW);
    expect(rows.find((r) => r.id === b.id)?.clashes).toEqual([a.reference]);
    expect(rows.find((r) => r.id === a.id)?.clashes).toEqual([]);
  });

  it('edits details and audits only real changes', async () => {
    const lead = await enquire({ eventDate: '2027-07-03' });
    await updateDetails(db, lead.id, { headcount: 200, cateringNotes: 'Partner: Auntie Esi Catering', eventType: lead.eventType }, STAFF, NOW);
    const [entry] = (await db.select().from(auditLog).where(eq(auditLog.entityId, String(lead.id)))).filter((a) => a.action === 'update');
    expect(entry.diff).toEqual({ headcount: 200, cateringNotes: 'Partner: Auntie Esi Catering' });
    await expect(updateDetails(db, lead.id, { eventDate: '2026-01-01' }, STAFF, NOW)).rejects.toMatchObject({ status: 400 });
  });
});
