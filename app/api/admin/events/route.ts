import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { confirmEvent, createEventLead, listEventLeads, markLost, recordDeposit, reopenLead, sendQuote, updateDetails } from '@/lib/events';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const cedis = z.coerce.number().min(0).transform((v) => Math.round(v * 100));

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('events', 'view', async () => {
  return NextResponse.json(await listEventLeads(await getDb()));
});

const createSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  email: z.string().trim().optional(),
  eventDate: z.string(),
  eventType: z.string().trim().min(2),
  headcount: z.coerce.number().int().min(1),
  cateringRequired: z.boolean().optional(),
  notes: z.string().optional(),
  source: z.enum(['phone', 'walk_in']).default('phone'),
});

/** Staff-entered lead (phone / walk-in). No auto-message — staff are already talking to them. */
export const POST = guard('events', 'full', async (request, staff) => {
  const { source, ...input } = createSchema.parse(await request.json());
  const lead = await run(async () => createEventLead(await getDb(), input, { actor: staff, source }));
  return NextResponse.json(lead, { status: 201 });
});

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('quote'), id: z.number().int(), quoteAmount: cedis, depositAmount: cedis, quoteNotes: z.string().max(4000).optional() }),
  z.object({ action: z.literal('payment'), id: z.number().int(), amount: cedis, method: z.enum(['cash', 'momo', 'transfer', 'card']), reference: z.string().max(120).optional() }),
  z.object({ action: z.literal('confirm'), id: z.number().int() }),
  z.object({ action: z.literal('lost'), id: z.number().int(), reason: z.string().max(500).default('') }),
  z.object({ action: z.literal('reopen'), id: z.number().int() }),
  z.object({
    action: z.literal('update'), id: z.number().int(),
    eventDate: z.string().optional(), eventType: z.string().trim().min(2).optional(), headcount: z.coerce.number().int().min(1).optional(),
    cateringRequired: z.boolean().optional(), cateringNotes: z.string().max(4000).optional(), staffNotes: z.string().max(4000).optional(),
    name: z.string().trim().min(2).optional(), phone: z.string().trim().min(7).optional(), email: z.string().trim().nullable().optional(),
  }),
]);

export const PATCH = guard('events', 'full', async (request, staff) => {
  const a = actionSchema.parse(await request.json());
  const db = await getDb();
  const lead = await run(async () => {
    switch (a.action) {
      case 'quote': return sendQuote(db, a.id, a, staff);
      case 'payment': return recordDeposit(db, a.id, a, staff);
      case 'confirm': return confirmEvent(db, a.id, staff);
      case 'lost': return markLost(db, a.id, a.reason, staff);
      case 'reopen': return reopenLead(db, a.id, staff);
      case 'update': {
        const { action: _a, id, ...patch } = a;
        return updateDetails(db, id, { ...patch, ...(patch.email !== undefined ? { email: patch.email || null } : {}) }, staff);
      }
    }
  });
  const messaged = ['quote', 'payment', 'confirm'].includes(a.action);
  if (messaged) after(() => deliverQueued(db, { eventLeadId: a.id }));
  return NextResponse.json({ lead, messaged });
});
