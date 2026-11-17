import { afterEach, describe, expect, it, vi } from 'vitest';
import { authSecret } from '@/lib/auth/secret';

afterEach(() => vi.unstubAllEnvs());
describe('authentication configuration', () => {
  it('requires an explicit secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_JWT_SECRET', '');
    expect(() => authSecret()).toThrow('ADMIN_JWT_SECRET');
  });
  it('uses the configured secret', () => {
    vi.stubEnv('ADMIN_JWT_SECRET', 'test-secret');
    expect(authSecret()).toBe('test-secret');
  });
  it('supports local development without configuration', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ADMIN_JWT_SECRET', '');
    expect(authSecret()).toBeTruthy();
  });
});
