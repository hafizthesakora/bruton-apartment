import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runDailyJobs } from '@/lib/notify/jobs';
import { syncAllFeeds } from '@/lib/channel';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Called by Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = await getDb();
  const result = { ...await runDailyJobs(db), channels: await syncAllFeeds(db) };
  console.log('[cron] daily', JSON.stringify(result));
  return NextResponse.json(result);
}
