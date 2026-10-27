import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { can, permissionForPath } from '@/lib/auth/rbac';

function getSecret() {
  return new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || 'bruton-admin-fallback-secret-change-in-prod'
  );
}

async function readSession(request) {
  const token = request.cookies.get('admin-token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

/**
 * Coarse gate for staff pages and admin APIs: signed in + role may view the area.
 * Route handlers re-check (including full vs view access) against the live DB record.
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/admin');

  if (pathname === '/api/admin/auth') return NextResponse.next();

  const session = await readSession(request);

  if (pathname === '/admin/login') {
    return session ? NextResponse.redirect(new URL('/admin', request.url)) : NextResponse.next();
  }

  if (!session) {
    return isApi
      ? NextResponse.json({ error: 'Not signed in' }, { status: 401 })
      : NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const perm = permissionForPath(pathname);
  // Admin API writes need full access; reads (and page visits) need at least view.
  const need = isApi && !['GET', 'HEAD'].includes(request.method) ? 'full' : 'view';
  if (perm && !can(session.role, perm, need)) {
    return isApi
      ? NextResponse.json({ error: 'You do not have access to this' }, { status: 403 })
      : NextResponse.redirect(new URL('/admin?denied=1', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
