import { guard } from '@/lib/auth/staff';
import { NextResponse } from 'next/server';
import { readJSON, updateJSON } from '@/lib/data';

export const GET = guard('enquiries', 'view', async () => {
  const enquiries = await readJSON('enquiries.json') || [];
  return NextResponse.json(enquiries);
});

export const PATCH = guard('enquiries', 'full', async (request) => {
  try {
    const { id, read } = await request.json();
    if (typeof id !== 'string' || typeof read !== 'boolean') return NextResponse.json({ error: 'Invalid enquiry update' }, { status: 400 });
    await updateJSON('enquiries.json', (enquiries) => enquiries.map((e) => (e.id === id ? { ...e, read } : e)));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to update' }, { status: 500 });
  }
});

export const DELETE = guard('enquiries', 'full', async (request) => {
  try {
    const { id } = await request.json();
    if (typeof id !== 'string') return NextResponse.json({ error: 'Invalid enquiry ID' }, { status: 400 });
    await updateJSON('enquiries.json', (enquiries) => enquiries.filter((e) => e.id !== id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 });
  }
});
