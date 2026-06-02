'use client';

import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, Search } from 'lucide-react';
import { CURRENT_ADMIN } from '@/lib/dummydataadmin';

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
    <header className="flex h-[64px] items-center justify-between bg-white px-6">
      {/* Left: Title or Search */}
      <div className="flex-1">
        {isDashboard ? (
          <div className="relative max-w-[500px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="h-11 w-full rounded-full border border-gray-200 bg-[#F8FAFC] pl-11 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#3B82F6]"
            />
          </div>
        ) : isKKDetail ? (
          <h1 className="text-lg font-bold">
            <span className="text-[#3B82F6]/60">Kartu Keluarga {'>'} </span>
            <span className="text-[#3B82F6]">Detail</span>
          </h1>
        ) : (
          <h1 className="text-lg font-bold text-[#3B82F6]">{title}</h1>
        )}
      </div>

      {/* Right: Notification + Help + Profile */}
      <div className="flex items-center gap-4">
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200">
          <Bell className="h-5 w-5" />
        </button>
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Profile */}
        <div className="ml-2 flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${CURRENT_ADMIN.avatarColor} text-sm font-bold text-white`}>
            {CURRENT_ADMIN.initials}
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#1E293B]">{CURRENT_ADMIN.name}</p>
            <p className="text-xs font-medium text-[#94A3B8]">@{CURRENT_ADMIN.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
