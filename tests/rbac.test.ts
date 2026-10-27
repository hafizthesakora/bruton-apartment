import { describe, it, expect } from 'vitest';
import { can, levelFor, permissionForPath } from '@/lib/auth/rbac';

describe('RBAC matrix (PMS plan §5)', () => {
  it('matches the spec for front desk', () => {
    expect(can('front_desk', 'bookings', 'full')).toBe(true);
    expect(can('front_desk', 'refunds', 'view')).toBe(false);
    expect(levelFor('front_desk', 'rates')).toBe('view');
    expect(can('front_desk', 'reports')).toBe(false);
  });

  it('limits housekeeping to the housekeeping board', () => {
    expect(can('housekeeping', 'housekeeping', 'full')).toBe(true);
    expect(can('housekeeping', 'bookings')).toBe(false);
    expect(can('housekeeping', 'guests')).toBe(false);
  });

  it('gives managers view-only user management', () => {
    expect(can('manager', 'users', 'view')).toBe(true);
    expect(can('manager', 'users', 'full')).toBe(false);
    expect(can('manager', 'refunds', 'full')).toBe(true);
  });

  it('denies when there is no role', () => {
    expect(can(undefined, 'dashboard')).toBe(false);
  });

  it('maps pages and API routes to permissions', () => {
    expect(permissionForPath('/admin')).toBe('dashboard');
    expect(permissionForPath('/admin/front-desk')).toBe('checkin');
    expect(permissionForPath('/api/admin/staff')).toBe('users');
    expect(permissionForPath('/api/admin/folios/12/refund')).toBe('payments');
    expect(permissionForPath('/admin/settingsx')).toBe('dashboard');
  });
});
