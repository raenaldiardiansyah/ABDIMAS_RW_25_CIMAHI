'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { getAdminProfile, type AdminProfile } from '@/lib/admin-profile';
import { AdminMobileSidebar } from './AdminSidebar';

const TITLE_MAP: Record<string, string> = {
  '/admin': '',
  '/admin/data-penduduk': 'Data Penduduk RW',
  '/admin/kartu-keluarga': 'Kartu Keluarga',
  '/admin/mutasi': 'Riwayat Mutasi Penduduk',
  '/admin/permohonan': 'Permohonan Penduduk',
  '/admin/laporan': 'Laporan & Statistik',
  '/admin/verification': 'Verifikasi Warga',
  '/admin/kegiatan': 'Kegiatan RW',
  '/admin/kelola-admin': 'Kelola Admin',
  '/admin/settings': 'Pengaturan',
};

export default function AdminTopbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<AdminProfile>(() => getAdminProfile());

  const isDashboard = pathname === '/admin';
  const isKKDetail = pathname.startsWith('/admin/kartu-keluarga/');

  const title = TITLE_MAP[pathname] || '';

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const session = await authClient.getSession().catch(() => null);
      if (!active) return;
      setProfile(getAdminProfile(session?.data?.user));
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="border-b border-[#D8DEE8] bg-[#F8FBFF] px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <AdminMobileSidebar />
        {isDashboard ? (
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              placeholder="Cari data warga, mutasi, atau permohonan"
              className="h-10 rounded-xl border-[#D8DEE8] bg-white pl-9 text-sm text-[#1F2937] shadow-sm"
            />
          </div>
        ) : isKKDetail ? (
          <h1 className="truncate text-lg font-semibold">
            <span className="text-[#7C8798]">Kartu Keluarga {'>'} </span>
            <span className="text-[#1F7A6B]">Detail</span>
          </h1>
        ) : (
          <h1 className="truncate text-lg font-semibold text-[#18212F]">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#D8DEE8] bg-white text-[#5B6574] transition hover:bg-[#EEF3F1] md:flex">
          <Bell className="h-5 w-5" />
        </button>
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#D8DEE8] bg-white text-[#5B6574] transition hover:bg-[#F3ECE7] md:flex">
          <HelpCircle className="h-5 w-5" />
        </button>

        <div className="ml-1 flex items-center gap-3 rounded-2xl border border-[#D8DEE8] bg-white px-3 py-2 shadow-sm">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${profile.avatarClassName} text-sm font-bold text-white`}>
            {profile.initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[#18212F]">{profile.name}</p>
            <p className="text-xs text-[#6B7280]">{profile.email}</p>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
