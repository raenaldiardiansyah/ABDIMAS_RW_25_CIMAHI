'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileInput,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  { href: '/admin/verification', label: 'Verifikasi Warga', icon: ShieldCheck },
  { href: '/admin/permohonan', label: 'Permohonan', icon: FileInput, hasNotification: true },
  { href: '/admin/laporan', label: 'Laporan', icon: TrendingUp },
];

const SYSTEM_NAV: NavItem[] = [
  { href: '/admin/kelola-admin', label: 'Kelola Admin', icon: IdCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminNavContent({ isCollapsed = false, mobile = false }: { isCollapsed?: boolean; mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

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
          'group relative flex items-center rounded-xl px-4 py-3 text-sm transition-colors',
          isCollapsed && !mobile ? 'justify-center' : 'gap-3',
          active
            ? 'bg-[#EAF2FF] font-semibold text-[#2563EB]'
            : 'text-slate-600 hover:bg-[#F4F8FF] hover:text-slate-900',
        )}
      >
        <div className="relative flex items-center justify-center">
          <Icon className="h-5 w-5 shrink-0" />
          {item.hasNotification ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
            </span>
          ) : null}
        </div>
        {(!isCollapsed || mobile) && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <nav className="flex h-full flex-col gap-6">
      <div className="space-y-1">{MAIN_NAV.map(renderItem)}</div>
      <div className="space-y-1">{ACTION_NAV.map(renderItem)}</div>
      <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
        {SYSTEM_NAV.map(renderItem)}
        <button
          type="button"
          onClick={async () => {
            await authClient.signOut().catch(() => null);
            router.push('/sign-in');
          }}
          className={cn(
            'flex w-full items-center rounded-xl px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-[#F4F8FF] hover:text-slate-900',
            isCollapsed && !mobile ? 'justify-center' : 'gap-3',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!isCollapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </nav>
  );
}

export function AdminMobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[#D8DEE8] bg-white lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] border-r border-[#D8DEE8] bg-[#F8FBFF] p-0">
        <div className="flex h-full flex-col p-5">
          <SheetHeader className="border-b border-[#D8DEE8] pb-4 text-left">
            <SheetTitle className="text-base font-semibold text-slate-900">Portal RW 25</SheetTitle>
          </SheetHeader>
          <div className="mt-5 flex-1">
            <AdminNavContent mobile />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 border-r border-[#D8DEE8] bg-[#F8FBFF] backdrop-blur lg:flex',
        isCollapsed ? 'w-[88px]' : 'w-[272px]',
      )}
    >
      <div className="flex h-full w-full flex-col p-4">
        <div className={cn('mb-6 flex items-center', isCollapsed ? 'justify-center' : 'justify-between')}>
          {!isCollapsed ? (
            <div>
              <p className="text-sm font-semibold text-slate-900">Portal RW 25</p>
              <p className="text-xs text-[#667085]">Admin dashboard</p>
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <AdminNavContent isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
