'use client';

import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, Search } from 'lucide-react';
import { CURRENT_ADMIN } from '@/lib/dummydataadmin';
import { Input } from '@/components/ui/input';
import { AdminMobileSidebar } from './AdminSidebar';

const TITLE_MAP: Record<string, string> = {
  '/admin': '',
  '/admin/data-penduduk': 'Data Penduduk RW',
  '/admin/kartu-keluarga': 'Kartu Keluarga',
  '/admin/mutasi': 'Riwayat Mutasi Penduduk',
  '/admin/permohonan': 'Permohonan Penduduk',
  '/admin/laporan': 'Laporan & Statistik',
  '/admin/kegiatan': 'Kegiatan RW',
  '/admin/kelola-admin': 'Kelola Admin',
  '/admin/settings': 'Pengaturan',
};

export default function AdminTopbar() {
  const pathname = usePathname();

  const isDashboard = pathname === '/admin';
  const isKKDetail = pathname.startsWith('/admin/kartu-keluarga/');

  const title = TITLE_MAP[pathname] || '';

  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <AdminMobileSidebar />
        {isDashboard ? (
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search"
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm"
            />
          </div>
        ) : isKKDetail ? (
          <h1 className="truncate text-lg font-semibold">
            <span className="text-slate-400">Kartu Keluarga {'>'} </span>
            <span className="text-primary">Detail</span>
          </h1>
        ) : (
          <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 md:flex">
          <Bell className="h-5 w-5" />
        </button>
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 md:flex">
          <HelpCircle className="h-5 w-5" />
        </button>

        <div className="ml-1 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${CURRENT_ADMIN.avatarColor} text-sm font-bold text-white`}>
            {CURRENT_ADMIN.initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{CURRENT_ADMIN.name}</p>
            <p className="text-xs text-slate-500">@{CURRENT_ADMIN.email}</p>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
