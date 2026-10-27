/**
 * Guest account session: a signed cookie holding the contact key. Signed with a key derived
 * separately from the staff one, so a guest token can never pass the admin check.
 */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const GUEST_COOKIE = 'guest-session';
const MAX_AGE = 30 * 24 * 3600;

const secret = () => new TextEncoder().encode(`${process.env.ADMIN_JWT_SECRET || 'bruton-admin-fallback-secret-change-in-prod'}|guest-account`);

export async function startGuestSession(key: string) {
  const token = await new SignJWT({ k: key, typ: 'guest' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(GUEST_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE,
  });
}

export async function guestSessionKey(): Promise<string | null> {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.typ === 'guest' && typeof payload.k === 'string' ? payload.k : null;
  } catch {
    return null;
  }
}

export async function endGuestSession() {
  (await cookies()).delete(GUEST_COOKIE);
}
