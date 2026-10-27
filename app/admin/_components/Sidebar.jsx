'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Images,
  Mail,
  Settings,
  LogOut,
  Building2,
  CalendarDays,
  ConciergeBell,
  Receipt,
  Users,
  BedDouble,
  Sparkles,
  Wrench,
  PartyPopper,
  UtensilsCrossed,
  Wallet,
  BarChart3,
  RefreshCcw,
  ShieldCheck,
  History,
  Eye,
} from 'lucide-react';
import { can, ROLE_LABELS, permissionForPath } from '@/lib/auth/rbac';
import { useStaff } from './StaffContext';

const navGroups = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/calendar', label: 'Booking Calendar', icon: CalendarDays },
      { href: '/admin/front-desk', label: 'Front Desk', icon: ConciergeBell },
      { href: '/admin/folios', label: 'Folios & Payments', icon: Receipt },
      { href: '/admin/guests', label: 'Guests', icon: Users },
      { href: '/admin/viewings', label: 'Viewings', icon: Eye },
      { href: '/admin/housekeeping', label: 'Housekeeping', icon: Sparkles },
      { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/admin/events', label: 'Events', icon: PartyPopper },
      { href: '/admin/kitchen', label: 'Kitchen & Menu', icon: UtensilsCrossed },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/admin/apartments', label: 'Apartments & Rates', icon: BedDouble },
      { href: '/admin/expenses', label: 'Expenses', icon: Wallet },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { href: '/admin/channel', label: 'Channel Sync', icon: RefreshCcw },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/content', label: 'Page Content', icon: FileText },
      { href: '/admin/media', label: 'Image Carousel', icon: Images },
      { href: '/admin/enquiries', label: 'Enquiries', icon: Mail },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/admin/staff', label: 'Staff & Roles', icon: ShieldCheck },
      { href: '/admin/audit', label: 'Audit Log', icon: History },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const staff = useStaff();

  if (pathname === '/admin/login') return null;

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  function isActive(item) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const visible = (item) => staff && can(staff.role, permissionForPath(item.href), 'view');

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col flex-shrink-0 print:hidden">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-slate-900" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Bruton Gardens</p>
            <p className="text-slate-400 text-xs">
              {staff ? `${staff.name} · ${ROLE_LABELS[staff.role]}` : 'Admin Panel'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const items = group.items.filter(visible);
          if (!items.length) return null;
          return (
            <div key={group.label ?? 'main'} className="space-y-1">
              {group.label && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.label}</p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-lime-400 text-slate-900'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
