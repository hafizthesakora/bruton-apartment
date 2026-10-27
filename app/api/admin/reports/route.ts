import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { loadSite } from '@/lib/notify';
import { report, reportSheets } from '@/lib/reports';
import { buildXlsx } from '@/lib/xlsx';

export const dynamic = 'force-dynamic';

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=xlsx] */
export const GET = guard('reports', 'view', async (request) => {
  const q = new URL(request.url).searchParams;
  const db = await getDb();
  let r;
  try {
    r = await report(db, q.get('from') ?? '', q.get('to') ?? '');
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
  if (q.get('format') !== 'xlsx') return NextResponse.json(r);

  const { site } = await loadSite(db);
  const file = buildXlsx(reportSheets(r, site.name));
  return new Response(file as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="bruton-report-${r.from}-to-${r.to}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
});
