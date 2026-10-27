/**
 * Role-based access — the PMS plan §5 matrix, plus defaults for modules the matrix
 * doesn't list. Edge-safe (no Node imports) so middleware can use it too.
 */

export type Role = 'owner' | 'manager' | 'front_desk' | 'housekeeping';
export type Level = 'full' | 'view' | 'none';

export const ROLES: Role[] = ['owner', 'manager', 'front_desk', 'housekeeping'];

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  front_desk: 'Front desk',
  housekeeping: 'Housekeeping',
};

//                    owner   manager  front_desk housekeeping
const M = (o: Level, m: Level, f: Level, h: Level) => ({ owner: o, manager: m, front_desk: f, housekeeping: h });

export const MATRIX = {
  // §5 matrix
  bookings:     M('full', 'full', 'full', 'none'),
  checkin:      M('full', 'full', 'full', 'none'),
  payments:     M('full', 'full', 'full', 'none'),
  refunds:      M('full', 'full', 'none', 'none'),
  rates:        M('full', 'full', 'view', 'none'),
  housekeeping: M('full', 'full', 'view', 'full'),
  guests:       M('full', 'full', 'full', 'none'),
  reports:      M('full', 'full', 'none', 'none'),
  users:        M('full', 'view', 'none', 'none'),
  // Modules outside the §5 table — defaults, adjust once the staff list is in
  dashboard:    M('full', 'full', 'full', 'full'),
  enquiries:    M('full', 'full', 'full', 'none'),
  events:       M('full', 'full', 'view', 'none'),
  kitchen:      M('full', 'full', 'full', 'none'),
  maintenance:  M('full', 'full', 'full', 'full'),
  expenses:     M('full', 'full', 'none', 'none'),
  channel:      M('full', 'full', 'view', 'none'),
  content:      M('full', 'full', 'none', 'none'),
  settings:     M('full', 'view', 'none', 'none'),
  audit:        M('full', 'none', 'none', 'none'),
} as const satisfies Record<string, Record<Role, Level>>;

export type Permission = keyof typeof MATRIX;

export function levelFor(role: Role | undefined, perm: Permission): Level {
  if (!role) return 'none';
  return MATRIX[perm]?.[role] ?? 'none';
}

export function can(role: Role | undefined, perm: Permission, need: 'view' | 'full' = 'view'): boolean {
  const have = levelFor(role, perm);
  return need === 'view' ? have !== 'none' : have === 'full';
}

/**
 * First matching path prefix decides the permission for an admin page or API route.
 * Order matters: more specific prefixes first.
 */
const ROUTE_PERMISSIONS: [string, Permission][] = [
  ['/admin/calendar', 'bookings'],
  ['/admin/bookings', 'bookings'],
  ['/admin/front-desk', 'checkin'],
  ['/admin/folios', 'payments'],
  ['/admin/guests', 'guests'],
  ['/admin/viewings', 'bookings'],
  ['/admin/change-requests', 'bookings'],
  ['/admin/apartments', 'rates'],
  ['/admin/rates', 'rates'],
  ['/admin/housekeeping', 'housekeeping'],
  ['/admin/maintenance', 'maintenance'],
  ['/admin/events', 'events'],
  ['/admin/kitchen', 'kitchen'],
  ['/admin/menu', 'kitchen'],
  ['/admin/expenses', 'expenses'],
  ['/admin/reports', 'reports'],
  ['/admin/channel', 'channel'],
  ['/admin/staff', 'users'],
  ['/admin/audit', 'audit'],
  ['/admin/enquiries', 'enquiries'],
  ['/admin/content', 'content'],
  ['/admin/media', 'content'],
  ['/admin/carousel', 'content'],
  ['/admin/upload', 'content'],
  ['/admin/settings', 'settings'],
  ['/admin', 'dashboard'],
];

/** Accepts either `/admin/...` page paths or `/api/admin/...` API paths. */
export function permissionForPath(pathname: string): Permission | null {
  const p = pathname.startsWith('/api/admin') ? pathname.slice('/api'.length) : pathname;
  for (const [prefix, perm] of ROUTE_PERMISSIONS) {
    if (p === prefix || p.startsWith(prefix + '/')) return perm;
  }
  return null;
}
