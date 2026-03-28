import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET() {
  const enquiries = await readJSON('enquiries.json') || [];
  return NextResponse.json(enquiries);
}

export async function PATCH(request) {
  try {
    const { id, read } = await request.json();
    const enquiries = await readJSON('enquiries.json') || [];
    const updated = enquiries.map((e) => (e.id === id ? { ...e, read } : e));
    await writeJSON('enquiries.json', updated);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const enquiries = await readJSON('enquiries.json') || [];
    const filtered = enquiries.filter((e) => e.id !== id);
    await writeJSON('enquiries.json', filtered);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 });
  }
}
