import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/auth/staff';
import { BookingError } from './engine';

/** Wrap a public booking route: BookingErrors become friendly JSON, everything else goes through errorResponse. */
export function publicRoute<C = unknown>(handler: (request: Request, ctx: C) => Promise<Response>) {
  return async (request: Request, ctx: C) => {
    try {
      return await handler(request, ctx);
    } catch (err) {
      if (err instanceof BookingError) return NextResponse.json({ error: err.message }, { status: err.status });
      // Guests see the plain message, not the zod field path.
      if (err && typeof err === 'object' && 'issues' in err) {
        const [first] = (err as { issues: { message: string }[] }).issues;
        return NextResponse.json({ error: first?.message ?? 'Please check your details' }, { status: 400 });
      }
      return errorResponse(err);
    }
  };
}
