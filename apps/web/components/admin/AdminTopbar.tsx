'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Info,
  Rocket,
  Search,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  '/admin/data-penduduk/tambah': 'Data Penduduk RW > Tambah Warga',
  '/admin/mutasi/tambah': 'Riwayat Mutasi Penduduk > Tambah Mutasi',
  '/admin/kegiatan': 'Kegiatan RW',
  '/admin/kelola-admin': 'Kelola Admin',
  '/admin/settings': 'Pengaturan',
};

type NotifStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export default function AdminTopbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<AdminProfile>(() => getAdminProfile());
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('default');
  const [helpOpen, setHelpOpen] = useState(false);

  const isDashboard = pathname === '/admin';
  const isKKDetail = pathname.startsWith('/admin/kartu-keluarga/');

  const title = TITLE_MAP[pathname] || '';

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setNotifStatus('unsupported');
      return;
    }

    setNotifStatus(Notification.permission as NotifStatus);
  }, []);

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

  const handleNotificationClick = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotifStatus('unsupported');
      return;
    }

    if (Notification.permission === 'granted') {
      // Already granted — show a test notification
      new Notification('Portal RW 25', {
        body: 'Notifikasi sudah aktif! Anda akan menerima pemberitahuan penting.',
        icon: '/favicon.ico',
      });
      return;
    }

    if (Notification.permission === 'denied') {
      setNotifStatus('denied');
      alert(
        'Anda telah memblokir izin notifikasi. Silakan klik ikon gembok 🔒 di samping URL browser Anda, lalu izinkan "Notifications" untuk website ini.'
      );
      return;
    }

    // Request permission
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission as NotifStatus);

      if (permission === 'granted') {
        new Notification('Portal RW 25', {
          body: 'Notifikasi berhasil diaktifkan!',
          icon: '/favicon.ico',
        });
      }
    } catch {
      setNotifStatus('denied');
    }
  }, []);

  const notifActive = notifStatus === 'granted';

  return (
    <>
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
          ) : (
            <Breadcrumb>
              <BreadcrumbList className="text-lg font-bold sm:text-xl">
                {(() => {
                  let parts: string[] = [];
                  if (isKKDetail) {
                    parts = ['Kartu Keluarga', 'Detail'];
                  } else {
                    parts = title ? title.split(' > ').map(p => p.trim()) : [];
                  }

                  const LINK_MAP: Record<string, string> = {
                    'Kartu Keluarga': '/admin/kartu-keluarga',
                    'Data Penduduk RW': '/admin/data-penduduk',
                    'Riwayat Mutasi Penduduk': '/admin/mutasi',
                  };

                  return parts.map((part, index) => {
                    const isLast = index === parts.length - 1;
                    const href = LINK_MAP[part] || '#';

                    return (
                      <div key={index} className="flex items-center gap-1.5 sm:gap-2.5">
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{part}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link href={href}>{part}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                      </div>
                    );
                  });
                })()}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Notification button */}
          <button
            type="button"
            onClick={handleNotificationClick}
            title={
              !notifActive
                ? notifStatus === 'denied'
                  ? 'Notifikasi diblokir — aktifkan di pengaturan browser'
                  : 'Aktifkan notifikasi'
                : 'Notifikasi aktif'
            }
            className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-[#D8DEE8] bg-white text-[#5B6574] transition hover:bg-[#EEF3F1] md:flex"
          >
            {!notifActive ? (
              <BellOff className="h-5 w-5 text-[#9CA3AF] opacity-70" />
            ) : (
              <>
                <Bell className="h-5 w-5 text-[#1F2937]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-green-500" />
              </>
            )}
          </button>

          {/* Help / About button */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            title="Bantuan & Tentang"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#D8DEE8] bg-white text-[#5B6574] transition hover:bg-[#F3ECE7] md:flex"
          >
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

      {/* Help / About Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1F2937]">
              Tentang Portal RW 25
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6B7280]">
              Panduan penggunaan & informasi aplikasi
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-5 text-sm text-[#374151]">
            {/* Section: Apa itu */}
            <div>
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[#1F2937]">
                <ClipboardList className="h-4 w-4 text-[#2563EB]" />
                Apa itu Portal RW 25?
              </h4>
              <p className="leading-relaxed text-[#6B7280]">
                Portal RW 25 adalah sistem informasi digital untuk mengelola data kependudukan warga
                di lingkungan RW 025, Kota Cimahi. Aplikasi ini membantu pengurus RW mengelola data
                warga, kartu keluarga, mutasi penduduk, dan permohonan secara efisien.
              </p>
            </div>

            {/* Section: Fitur */}
            <div>
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[#1F2937]">
                <Rocket className="h-4 w-4 text-[#2563EB]" />
                Fitur Utama
              </h4>
              <ul className="space-y-2 text-[#6B7280]">
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span><strong className="text-[#374151]">Dashboard</strong> — Ringkasan statistik warga, keluarga, dan mutasi penduduk secara real-time.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span><strong className="text-[#374151]">Data Penduduk</strong> — Tambah, edit, dan kelola seluruh data warga RW.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span><strong className="text-[#374151]">Kartu Keluarga</strong> — Kelola data KK beserta anggota keluarga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span><strong className="text-[#374151]">Mutasi Penduduk</strong> — Catat perpindahan masuk dan keluar warga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span><strong className="text-[#374151]">Permohonan</strong> — Terima dan proses permohonan dari warga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span><strong className="text-[#374151]">Kegiatan RW</strong> — Jadwalkan dan kelola kegiatan warga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span><strong className="text-[#374151]">Laporan</strong> — Ekspor data dan statistik dalam berbagai format.</span>
                </li>
              </ul>
            </div>

            {/* Section: Cara Penggunaan */}
            <div>
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[#1F2937]">
                <BookOpen className="h-4 w-4 text-[#2563EB]" />
                Cara Penggunaan
              </h4>
              <ol className="list-inside list-decimal space-y-1.5 text-[#6B7280]">
                <li>Gunakan <strong className="text-[#374151]">menu sidebar</strong> di sebelah kiri untuk navigasi antar halaman.</li>
                <li>Di <strong className="text-[#374151]">Dashboard</strong>, Anda bisa melihat ringkasan dan mengakses fitur utama dengan cepat.</li>
                <li>Gunakan <strong className="text-[#374151]">kolom pencarian</strong> di atas untuk mencari data warga, mutasi, atau permohonan.</li>
                <li>Klik <strong className="text-[#374151]">ikon notifikasi</strong> untuk mengaktifkan pemberitahuan browser.</li>
                <li>Untuk menambah data, gunakan tombol <strong className="text-[#374151]">Aksi Cepat</strong> di bagian bawah dashboard.</li>
              </ol>
            </div>

            {/* Section: Info Teknis */}
            <div className="rounded-xl bg-[#F8FAFC] p-4">
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[#1F2937]">
                <Info className="h-4 w-4 text-[#2563EB]" />
                Informasi
              </h4>
              <div className="space-y-1 text-xs text-[#6B7280]">
                <p><strong>Versi:</strong> 1.0.0</p>
                <p><strong>Dikembangkan oleh:</strong> Tim ABDIMAS — Telkom University</p>
                <p><strong>Untuk:</strong> RW 025, Kota Cimahi, Jawa Barat</p>
              </div>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <Button
              onClick={() => setHelpOpen(false)}
              className="rounded-xl bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8]"
            >
              Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
