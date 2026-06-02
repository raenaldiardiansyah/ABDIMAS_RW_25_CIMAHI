'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  RefreshCw,
  FileInput,
  TrendingUp,
  IdCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasNotification?: boolean;
};

const MAIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/data-penduduk', label: 'Data Penduduk', icon: Users },
  { href: '/admin/kartu-keluarga', label: 'Kartu Keluarga', icon: ClipboardList },
  { href: '/admin/kegiatan', label: 'Kegiatan RW', icon: Calendar },
  { href: '/admin/mutasi', label: 'Mutasi Penduduk', icon: RefreshCw },
];

const ACTION_NAV: NavItem[] = [
  { href: '/admin/permohonan', label: 'Permohonan', icon: FileInput, hasNotification: true },
  { href: '/admin/laporan', label: 'Laporan', icon: TrendingUp },
];

const SYSTEM_NAV: NavItem[] = [
  { href: '/admin/kelola-admin', label: 'Kelola admin', icon: IdCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'relative flex items-center px-6 py-3.5 text-[14px] transition-all duration-200 rounded-r-full',
          isCollapsed ? 'justify-center w-[80%]' : 'gap-3 w-[90%]',
          active
            ? 'font-bold bg-[#EFF6FF] text-[#2563EB]'
            : 'font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#334155]',
        )}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#2563EB] rounded-r-full" />
        )}
        <div className="relative flex items-center justify-center">
          <Icon className="h-5 w-5 shrink-0" />
          {item.hasNotification && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
            </span>
          )}
        </div>
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto bg-white transition-all duration-300',
        isCollapsed ? 'w-[80px]' : 'w-[18%] min-w-[180px] max-w-[260px]'
      )}
    >
      {/* Spacer aligned with topbar height */}
      <div className="flex h-[64px] items-center justify-end px-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col">
        {/* Blok 1: Main Navigation */}
        <div className="flex flex-col">{MAIN_NAV.map(renderItem)}</div>

        {/* Spacer between groups */}
        <div className="my-6" />

        {/* Blok 2: Action & Report */}
        <div className="flex flex-col">{ACTION_NAV.map(renderItem)}</div>

        {/* Blok 3: System — pushed to bottom */}
        <div className="mt-auto flex flex-col pb-6">
          {SYSTEM_NAV.map(renderItem)}
          <button
            onClick={() => console.log('Logout clicked')}
            className={cn(
              'flex items-center border-l-[3px] border-transparent px-6 py-2.5 text-[13px] font-medium text-[#64748B] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#334155]',
              isCollapsed ? 'justify-center w-[80%] rounded-r-full' : 'gap-3'
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed && <span>LogOut</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
