'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { platformFetch } from '@/lib/api/platform';

const TITLE_MAP: Record<string, string> = {
  '/admin': '',
  '/admin/data-penduduk': 'Data Penduduk RW',
  '/admin/kartu-keluarga': 'Kartu Keluarga',
  '/admin/mutasi': 'Riwayat Mutasi Penduduk',
  '/admin/permohonan': 'Permohonan Penduduk',
  '/admin/verification': 'Verifikasi Warga',
  '/admin/laporan': 'Aduan Warga',
  '/admin/data-penduduk/tambah': 'Data Penduduk RW > Tambah Warga',
  '/admin/mutasi/tambah': 'Riwayat Mutasi Penduduk > Tambah Mutasi',
  '/admin/kegiatan': 'Kegiatan RW',
  '/admin/hak-akses': 'Kelola Hak Akses',
  '/admin/hak-akses/tambah': 'Kelola Hak Akses > Tambah Pengguna',
  '/admin/settings': 'Pengaturan',
};

type NotifStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export default function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<AdminProfile>(() => getAdminProfile());
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('default');
  const [helpOpen, setHelpOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for open help dialog from other components
  useEffect(() => {
    const handler = () => setHelpOpen(true);
    document.addEventListener('open-admin-help', handler);
    return () => document.removeEventListener('open-admin-help', handler);
  }, []);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    let active = true;
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    async function doSearch() {
      setIsSearching(true);
      try {
        const res = await platformFetch<any>(`/admin/citizens?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (!active) return;
        setSearchResults(res.data || []);
      } catch (e) {
        if (active) setSearchResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }
    void doSearch();

    return () => { active = false; };
  }, [debouncedQuery]);

  const isDashboard = pathname === '/admin';
  const isKKDetail = pathname.startsWith('/admin/kartu-keluarga/');

  const title = TITLE_MAP[pathname] || '';

  // Check notification permission on mount and when updated
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPermission = () => {
      if (!('Notification' in window)) {
        setNotifStatus('unsupported');
        return;
      }
      setNotifStatus(Notification.permission as NotifStatus);
    };

    checkPermission();

    window.addEventListener('notif-updated', checkPermission);
    return () => window.removeEventListener('notif-updated', checkPermission);
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
      // Already granted ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â show a test notification
      new Notification('Portal RW 25', {
        body: 'Notifikasi sudah aktif! Anda akan menerima pemberitahuan penting.',
        icon: '/favicon.ico',
      });
      return;
    }

    if (Notification.permission === 'denied') {
      setNotifStatus('denied');
      alert(
        'Anda telah memblokir izin notifikasi. Silakan klik ikon gembok ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ di samping URL browser Anda, lalu izinkan "Notifications" untuk website ini.'
      );
      return;
    }

    // Request permission
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission as NotifStatus);
      window.dispatchEvent(new CustomEvent('notif-updated'));

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
      <header className="border-b border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AdminMobileSidebar />
          {isDashboard ? (
            <div className="relative w-full max-w-xl" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-subtle)]" />
              <Input
                placeholder="Cari data warga (nama atau NIK)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowDropdown(true);
                }}
                className="h-10 w-full rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] pl-9 text-sm text-[color:var(--admin-heading)] shadow-sm"
              />

              {/* Autocomplete Dropdown Bubble */}
              {showDropdown && debouncedQuery && (
                <div className="absolute top-full left-0 mt-2 w-full rounded-2xl border border-[color:var(--admin-border)] bg-white p-2 shadow-lg z-50 overflow-hidden">
                  {isSearching ? (
                    <div className="p-3 text-center text-sm text-[color:var(--admin-subtle)]">Mencari...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      <div className="px-3 pb-2 pt-1 text-xs font-semibold text-[color:var(--admin-subtle)] uppercase tracking-wide">
                        Hasil Pencarian Warga
                      </div>
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setShowDropdown(false);
                            router.push(`/admin/data-penduduk/${user.id}`);
                          }}
                          className="flex flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-[color:var(--admin-surface-soft)] transition"
                        >
                          <span className="font-semibold text-sm text-[color:var(--admin-heading)]">{user.name}</span>
                          <span className="text-xs text-[color:var(--admin-subtle)]">NIK: {user.nik}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push(`/admin/data-penduduk`);
                        }}
                        className="mt-1 rounded-xl bg-[#EFF6FF] px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-[#DBEAFE] text-center transition"
                      >
                        Lihat seluruh data penduduk
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-sm text-[color:var(--admin-subtle)]">
                      Warga tidak ditemukan.
                    </div>
                  )}
                </div>
              )}
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
                    'Kelola Hak Akses': '/admin/hak-akses',
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNotificationClick}
            title={
              !notifActive
                ? notifStatus === 'denied'
                  ? 'Notifikasi diblokir ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â aktifkan di pengaturan browser'
                  : 'Aktifkan notifikasi'
                : 'Notifikasi aktif'
            }
            className="relative hidden h-10 w-10 rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] text-[color:var(--admin-subtle)] transition hover:bg-[color:var(--admin-surface-soft)] md:inline-flex"
          >
            {!notifActive ? (
              <BellOff className="h-5 w-5 text-[color:var(--admin-muted)] opacity-70" />
            ) : (
              <>
                <Bell className="h-5 w-5 text-[color:var(--admin-heading)]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-green-500" />
              </>
            )}
          </Button>

          {/* Help / About button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setHelpOpen(true)}
            title="Bantuan & Tentang"
            className="hidden h-10 w-10 rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] text-[color:var(--admin-subtle)] transition hover:bg-[color:var(--admin-surface-soft)] md:inline-flex"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <div className="ml-1 flex items-center gap-3 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] px-3 py-2 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${profile.avatarClassName} text-sm font-bold text-white`}>
              {profile.initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[color:var(--admin-heading)]">{profile.name}</p>
              <p className="text-xs text-[color:var(--admin-subtle)]">{profile.email}</p>
            </div>
          </div>
        </div>
        </div>
      </header>

      {/* Help / About Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[color:var(--admin-heading)]">
              Tentang Portal RW 25
            </DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--admin-subtle)]">
              Panduan penggunaan & informasi aplikasi
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-5 text-sm text-[color:var(--admin-body)]">
            {/* Section: Apa itu */}
            <div>
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[color:var(--admin-heading)]">
                <ClipboardList className="h-4 w-4 text-[color:var(--admin-primary)]" />
                Apa itu Portal RW 25?
              </h4>
              <p className="leading-relaxed text-[color:var(--admin-subtle)]">
                Portal RW 25 adalah sistem informasi digital untuk mengelola data kependudukan warga
                di lingkungan RW 025, Kota Cimahi. Aplikasi ini membantu pengurus RW mengelola data
                warga, kartu keluarga, mutasi penduduk, dan permohonan secara efisien.
              </p>
            </div>

            {/* Section: Fitur */}
            <div>
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[color:var(--admin-heading)]">
                <Rocket className="h-4 w-4 text-[color:var(--admin-primary)]" />
                Fitur Utama
              </h4>
              <ul className="space-y-2 text-[color:var(--admin-subtle)]">
                <li className="flex gap-2">
                  <span className="shrink-0">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
                  <span><strong className="text-[color:var(--admin-body)]">Dashboard</strong> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Ringkasan statistik warga, keluarga, dan mutasi penduduk secara real-time.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
                  <span><strong className="text-[color:var(--admin-body)]">Data Penduduk</strong> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Tambah, edit, dan kelola seluruh data warga RW.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
                  <span><strong className="text-[color:var(--admin-body)]">Kartu Keluarga</strong> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Kelola data KK beserta anggota keluarga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
                  <span><strong className="text-[color:var(--admin-body)]">Mutasi Penduduk</strong> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Catat perpindahan masuk dan keluar warga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
                  <span><strong className="text-[color:var(--admin-body)]">Permohonan</strong> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Terima dan proses permohonan dari warga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
                  <span><strong className="text-[color:var(--admin-body)]">Kegiatan RW</strong> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Jadwalkan dan kelola kegiatan warga.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
                  <span><strong className="text-[color:var(--admin-body)]">Laporan</strong> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Ekspor data dan statistik dalam berbagai format.</span>
                </li>
              </ul>
            </div>

            {/* Section: Cara Penggunaan */}
            <div>
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[color:var(--admin-heading)]">
                <BookOpen className="h-4 w-4 text-[color:var(--admin-primary)]" />
                Cara Penggunaan
              </h4>
              <ol className="list-inside list-decimal space-y-1.5 text-[color:var(--admin-subtle)]">
                <li>Gunakan <strong className="text-[color:var(--admin-body)]">menu sidebar</strong> di sebelah kiri untuk navigasi antar halaman.</li>
                <li>Di <strong className="text-[color:var(--admin-body)]">Dashboard</strong>, Anda bisa melihat ringkasan dan mengakses fitur utama dengan cepat.</li>
                <li>Gunakan <strong className="text-[color:var(--admin-body)]">kolom pencarian</strong> di atas untuk mencari data warga, mutasi, atau permohonan.</li>
                <li>Klik <strong className="text-[color:var(--admin-body)]">ikon notifikasi</strong> untuk mengaktifkan pemberitahuan browser.</li>
                <li>Untuk menambah data, gunakan tombol <strong className="text-[color:var(--admin-body)]">Aksi Cepat</strong> di bagian bawah dashboard.</li>
              </ol>
            </div>

            {/* Section: Info Teknis */}
            <div className="rounded-xl bg-[color:var(--admin-surface-muted)] p-4">
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-[color:var(--admin-heading)]">
                <Info className="h-4 w-4 text-[color:var(--admin-primary)]" />
                Informasi
              </h4>
              <div className="space-y-1 text-xs text-[color:var(--admin-subtle)]">
                <p><strong>Versi:</strong> 1.0.0 (Build 2026.04)</p>
                <div>
                  <p><strong>Dikembangkan oleh:</strong> Tim ABDIMAS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Telkom University</p>
                  <ol className="list-decimal list-inside ml-2 mt-1 space-y-0.5">
                    <li>Raenaldi Ardiansyah Sidik - Front End Developer</li>
                    <li>Faiq Haqqani - UI/UX Designer</li>
                    <li>Muhammad Riyadhul Jinan Nasution - Back End Developer</li>
                  </ol>
                </div>
                <p><strong>Untuk:</strong> RW 025, Kota Cimahi, Jawa Barat</p>
              </div>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <Button
              onClick={() => setHelpOpen(false)}
              className="rounded-xl bg-primary px-6 text-primary-foreground hover:bg-[color:var(--admin-primary-strong)]"
            >
              Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
