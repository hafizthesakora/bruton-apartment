import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

function getSecret() {
  return new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || 'bruton-admin-fallback-secret-change-in-prod'
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    // Already signed in → send to dashboard
    const token = request.cookies.get('admin-token')?.value;
    if (token) {
      try {
        await jwtVerify(token, getSecret());
        return NextResponse.redirect(new URL('/admin', request.url));
      } catch {
        // Invalid token — let them see the login page
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
