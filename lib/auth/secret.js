/** Edge-safe shared key configuration for staff and guest authentication. */
export function authSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_JWT_SECRET must be set in production');
  }
  return 'bruton-admin-fallback-secret-change-in-prod';
}
