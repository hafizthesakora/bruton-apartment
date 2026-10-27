'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { can, type Permission, type Role } from '@/lib/auth/rbac';

export type StaffSession = { id: number; username: string; name: string; role: Role };

const Ctx = createContext<StaffSession | null>(null);

export function StaffProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [staff, setStaff] = useState<StaffSession | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    fetch('/api/admin/auth')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStaff)
      .catch(() => setStaff(null));
  }, [pathname === '/admin/login']); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={staff}>{children}</Ctx.Provider>;
}

export function useStaff() {
  return useContext(Ctx);
}

/** Does the signed-in staff member have this access? (UI hint only — the API enforces it.) */
export function useCan(perm: Permission, need: 'view' | 'full' = 'full') {
  const staff = useStaff();
  return can(staff?.role, perm, need);
}
