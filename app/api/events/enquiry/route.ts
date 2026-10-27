import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { bookedOnDate, createEventLead } from '@/lib/events';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const body = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(120),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(32),
  email: z.union([z.email('Enter a valid email').max(200), z.literal('')]).optional(),
  eventDate: z.string(),
  eventType: z.string().trim().min(2, 'Choose the type of event').max(80),
  headcount: z.coerce.number().int().min(1, 'Enter the number of guests').max(5000),
  cateringRequired: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export const POST = publicRoute(async (request) => {
  const db = await getDb();
  const input = body.parse(await request.json());
  const lead = await createEventLead(db, input);
  after(() => deliverQueued(db, { eventLeadId: lead.id }));
  const dateBooked = (await bookedOnDate(db, lead.eventDate, lead.id)).length > 0;
  return NextResponse.json({ reference: lead.reference, dateBooked }, { status: 201 });
});
