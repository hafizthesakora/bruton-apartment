import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { exportCalendar } from '@/lib/channel';

export const dynamic = 'force-dynamic';
export const GET = publicRoute(async (request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (!/^\d+$/.test(id)) return new Response('Not found', { status: 404 });
  const calendar = await exportCalendar(await getDb(), Number(id), token);
  return new Response(calendar, { headers: {
    'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, no-store',
    'Content-Disposition': 'inline; filename="availability.ics"', 'X-Robots-Tag': 'noindex',
  } });
});
