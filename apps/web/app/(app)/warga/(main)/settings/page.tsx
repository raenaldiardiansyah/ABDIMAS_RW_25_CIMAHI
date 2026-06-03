'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/(app)/warga/_components/theme-context';
import { useIdentity } from '@/app/(app)/warga/_components/identity-context';
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Globe,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Info,
  Smartphone,
  Check,
  Heart,
  Landmark,
} from 'lucide-react';
import SlideUpSheet from '@/components/warga/SlideUpSheet';
import StatusPopup from '@/components/warga/StatusPopup';
import { authClient } from '@/lib/auth-client';
import { useToast } from "@/components/ui/use-toast";
import { platformFetch } from '@/lib/api/platform';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DICT: Record<string, Record<string, string>> = {
  Indonesia: {
    title: 'Pengaturan',
    appearance: 'Tampilan',
    darkMode: 'Mode Gelap',
    active: 'Aktif',
    inactive: 'Nonaktif',
    language: 'Bahasa',
    notifPrivacy: 'Notifikasi & Privasi',
    notif: 'Notifikasi',
    security: 'Keamanan Akun',
    securityDesc: 'Ganti PIN & verifikasi',
    about: 'Tentang',
    appVersion: 'Versi Aplikasi',
    appAbout: 'Tentang Aplikasi',
    appAboutDesc: 'Info & lisensi',
    logout: 'Keluar dari Akun',
    logoutConfirm: 'Keluar dari Akun?',
    logoutDesc: 'Anda akan dikembalikan ke halaman login.',
    yesLogout: 'Ya, Keluar',
    cancel: 'Batal',
    chooseLang: 'Pilih Bahasa',
    langDesc: 'Sesuaikan bahasa yang digunakan pada aplikasi.',
    understand: 'Mengerti',
  },
  Sunda: {
    title: 'Pangaturan',
    appearance: 'Tampilan',
    darkMode: 'Mode Poek',
    active: 'Aktip',
    inactive: 'Teu Aktip',
    language: 'Basa',
    notifPrivacy: 'Bewara & Privasi',
    notif: 'Bewara',
    security: 'Kaamanan Akun',
    securityDesc: 'Ganti PIN & verifikasi',
    about: 'Ngeunaan',
    appVersion: 'Versi Aplikasi',
    appAbout: 'Ngeunaan Aplikasi',
    appAboutDesc: 'Inpo & lisensi',
    logout: 'Kaluar',
    logoutConfirm: 'Kaluar ti Akun?',
    logoutDesc: 'Anjeun bakal dipulangkeun ka kaca login.',
    yesLogout: 'Enya, Kaluar',
    cancel: 'Batal',
    chooseLang: 'Pilih Basa',
    langDesc: 'Saluyukeun basa nu dipake dina aplikasi.',
    understand: 'Ngartos',
  },
  English: {
    title: 'Settings',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    active: 'Active',
    inactive: 'Inactive',
    language: 'Language',
    notifPrivacy: 'Notifications & Privacy',
    notif: 'Notifications',
    security: 'Account Security',
    securityDesc: 'Change PIN & verification',
    about: 'About',
    appVersion: 'App Version',
    appAbout: 'About App',
    appAboutDesc: 'Info & licenses',
    logout: 'Log Out',
    logoutConfirm: 'Log Out?',
    logoutDesc: 'You will be returned to the login page.',
    yesLogout: 'Yes, Log Out',
    cancel: 'Cancel',
    chooseLang: 'Select Language',
    langDesc: 'Adjust the language used in the application.',
    understand: 'I Understand',
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const { isDark, toggleDark } = useTheme();
  const identity = useIdentity();
  const { toast } = useToast();
  const [notifikasi, setNotifikasi] = useState(true);
  const [bahasa, setBahasa] = useState('Indonesia');
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [activeSheet, setActiveSheet] = useState<'bahasa' | 'tentang' | null>(null);
  const [popup, setPopup] = useState<{ variant: 'success' | 'warning' | 'error', judul: string, deskripsi?: string } | null>(null);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      toast({ title: "Berhasil keluar", description: "Anda telah logout.", variant: "success" });
    } catch {
      toast({ title: "Gagal logout", description: "Silakan coba lagi.", variant: "destructive" });
    } finally {
      localStorage.removeItem('abdimas-logged');
      localStorage.removeItem('abdimas-role');
      localStorage.removeItem('abdimas-nik');
      router.push('/sign-in');
    }
  };

  useEffect(() => {
    let mounted = true;

    platformFetch<{
      id: string;
      userId: string;
      language: string;
      theme: string;
      notificationEnabled: boolean;
      createdAt: string;
      updatedAt: string;
    }>('/me/preferences')
      .then(({ data }) => {
        if (!mounted) return;
        setNotifikasi(data.notificationEnabled);
        setBahasa(data.language === 'en' ? 'English' : data.language === 'su' ? 'Sunda' : 'Indonesia');
      })
      .catch(() => {
        if (!mounted) return;
        toast({
          title: 'Gagal memuat pengaturan',
          description: 'Pengaturan default dipakai sementara.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        if (mounted) setLoadingPreferences(false);
      });

    return () => {
      mounted = false;
    };
  }, [toast]);

  const savePreferences = async (input: {
    language?: string;
    theme?: string;
    notificationEnabled?: boolean;
  }) => {
    await platformFetch('/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  };

  const handleBahasaSelect = async (lang: string) => {
    setBahasa(lang);
    setActiveSheet(null);
    const language = lang === 'English' ? 'en' : lang === 'Sunda' ? 'su' : 'id';
    try {
      await savePreferences({ language });
    } catch {
      toast({
        title: 'Gagal menyimpan bahasa',
        description: 'Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const t = DICT[bahasa] || DICT['Indonesia'];

  return (
    <WargaPage>
      <PageHeader
        title={t.title}
        variant="brand"
        className="pb-7"
        leftSlot={
          <Button
            onClick={() => router.back()}
            type="button"
            variant="secondary"
            size="icon"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/12 transition-colors hover:bg-white/18"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4 text-primary-foreground" />
          </Button>
        }
        bottomSlot={
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/14 text-xl font-bold shadow-lg">
              {(identity.userName?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold leading-tight">{identity.userName}</p>
              <p className="mt-1 truncate font-mono text-xs text-primary-foreground/70">{identity.maskedNik}</p>
              <p className="mt-1 truncate text-xs text-primary-foreground/70">{identity.userEmail}</p>
            </div>
          </div>
        }
      />

      <WargaPageBody className="flex flex-col gap-5">

        {/* ── Profil ──────────────────────────────────────── */}


        {/* ── Tampilan ────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1 transition-colors duration-300">
            {t.appearance}
          </p>
          <div className="bg-background rounded-2xl border border-input overflow-hidden transition-colors duration-300">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[color:var(--accent-violet)]/12 flex items-center justify-center">
                  {isDark ? <Moon className="w-4 h-4 text-[color:var(--accent-violet)]" /> : <Sun className="w-4 h-4 text-[color:var(--accent-amber)]" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground transition-colors duration-300">{t.darkMode}</p>
                  <p className="text-[11px] text-muted-foreground transition-colors duration-300">{isDark ? t.active : t.inactive}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  toggleDark();
                  try {
                    await savePreferences({ theme: isDark ? 'light' : 'dark' });
                  } catch {
                    toast({
                      title: 'Gagal menyimpan tema',
                      description: 'Silakan coba lagi.',
                      variant: 'destructive',
                    });
                  }
                }}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  isDark ? 'bg-primary' : 'bg-muted-foreground/35'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-[color:var(--panel-on-brand)] shadow-md transition-all duration-300 ${
                  isDark ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="h-px bg-input mx-4" />

            {/* Bahasa */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/60 transition-colors"
              onClick={() => setActiveSheet('bahasa')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[color:var(--accent-mint)]/12 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[color:var(--accent-mint)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground transition-colors duration-300">{t.language}</p>
                  <p className="text-[11px] text-muted-foreground transition-colors duration-300">{bahasa}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
            </div>
          </div>
        </div>

        {/* ── Notifikasi & Privasi ─────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1 transition-colors duration-300">
            {t.notifPrivacy}
          </p>
          <div className="bg-background rounded-2xl border border-input overflow-hidden transition-colors duration-300">
            {/* Notifikasi Toggle */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[color:var(--accent-amber)]/12 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[color:var(--accent-amber)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground transition-colors duration-300">{t.notif}</p>
                  <p className="text-[11px] text-muted-foreground transition-colors duration-300">{notifikasi ? t.active : t.inactive}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const nextValue = !notifikasi;
                  setNotifikasi(nextValue);
                  try {
                    await savePreferences({ notificationEnabled: nextValue });
                  } catch {
                    setNotifikasi(!nextValue);
                    toast({
                      title: 'Gagal menyimpan notifikasi',
                      description: 'Silakan coba lagi.',
                      variant: 'destructive',
                    });
                  }
                }}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  notifikasi ? 'bg-primary' : 'bg-muted-foreground/35'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-[color:var(--panel-on-brand)] shadow-md transition-all duration-300 ${
                  notifikasi ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="h-px bg-input mx-4" />

            {/* Keamanan */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/60 transition-colors"
              onClick={() => setPopup({ 
                variant: 'warning', 
                judul: 'Fitur Segera Hadir', 
                deskripsi: 'Pengaturan keamanan akun sedang dalam tahap pengembangan.' 
              })}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground transition-colors duration-300">{t.security}</p>
                  <p className="text-[11px] text-muted-foreground transition-colors duration-300">{t.securityDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
            </div>
          </div>
        </div>

        {/* ── Tentang ─────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1 transition-colors duration-300">
            {t.about}
          </p>
          <div className="bg-background rounded-2xl border border-input overflow-hidden transition-colors duration-300">
            {/* Versi Aplikasi */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/60 transition-colors"
              onClick={() => setPopup({ 
                variant: 'success', 
                judul: 'Versi Terbaru', 
                deskripsi: 'Anda sudah menggunakan aplikasi versi terbaru (v1.0.0).' 
              })}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[color:var(--accent-violet)]/12 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-[color:var(--accent-violet)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground transition-colors duration-300">{t.appVersion}</p>
                  <p className="text-[11px] text-muted-foreground transition-colors duration-300">v1.0.0 (Build 2026.04)</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-input mx-4" />

            {/* Tentang Aplikasi */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/60 transition-colors"
              onClick={() => setActiveSheet('tentang')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground transition-colors duration-300">{t.appAbout}</p>
                  <p className="text-[11px] text-muted-foreground transition-colors duration-300">{t.appAboutDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
            </div>
          </div>
        </div>

        {/* ── Tombol Keluar ───────────────────────────────── */}
        <Button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          variant="outline"
          className="w-full h-auto py-3.5 rounded-2xl border-2 border-[color:var(--accent-coral)]/35 text-[color:var(--accent-coral)] font-bold text-sm hover:bg-[color:var(--accent-coral)]/10 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground/70 transition-colors duration-300">
          {loadingPreferences ? 'Memuat pengaturan...' : '© 2026 Abdi Masyarakat — RW 25 Kota Cimahi'}
        </p>
      </WargaPageBody>

      {/* ═══ INTERAKTIF (SHEETS & POPUPS) ═══════════════════ */}

      {/* Sheet: Pilihan Bahasa */}
      <SlideUpSheet
        isOpen={activeSheet === 'bahasa'}
        onClose={() => setActiveSheet(null)}
        title={t.chooseLang}
        deskripsi={t.langDesc}
      >
        <div className="flex flex-col gap-2 mt-2">
          {['Indonesia', 'Sunda', 'English'].map((lang) => (
            <Button
              key={lang}
              type="button"
              variant="outline"
              onClick={() => handleBahasaSelect(lang)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                bahasa === lang 
                  ? 'border-[color:var(--brand-600)] bg-[color:color-mix(in srgb, var(--brand-600) 5%, transparent)]' 
                  : 'border-input bg-background hover:bg-accent'
              }`}
            >
              <span className={`text-sm font-semibold ${
                bahasa === lang ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {lang}
              </span>
              {bahasa === lang && <Check className="w-5 h-5 text-foreground" />}
            </Button>
          ))}
        </div>
      </SlideUpSheet>

      {/* Sheet: Tentang Aplikasi */}
      <SlideUpSheet
        isOpen={activeSheet === 'tentang'}
        onClose={() => setActiveSheet(null)}
        title={t.appAbout}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
            <Landmark className="w-10 h-10 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Portal RW 25</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Aplikasi ini dikembangkan untuk memudahkan warga RW 25 Kota Cimahi dalam mengakses informasi dan layanan administrasi tingkat RT/RW.
            </p>
          </div>
          <div className="w-full h-px bg-input my-2" />
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center justify-center gap-1.5">
              Dibuat dengan <Heart className="w-3.5 h-3.5 text-[color:var(--accent-coral)]" aria-hidden="true" /> oleh Tim Abdi Masyarakat
            </span>
          </p>
        </div>
      </SlideUpSheet>

      {/* Popup: Status & Info */}
      {popup && (
        <StatusPopup
          isOpen={true}
          onClose={() => setPopup(null)}
          variant={popup.variant}
          judul={popup.judul}
          actions={
            <Button
              type="button"
              onClick={() => setPopup(null)} 
              className="w-full py-3 rounded-xl text-sm font-bold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t.understand}
            </Button>
          }
        >
          {popup.deskripsi && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              {popup.deskripsi}
            </p>
          )}
        </StatusPopup>
      )}

      {/* ═══ Popup Konfirmasi Logout ═══════════════════════ */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="w-full max-w-xs rounded-3xl p-6 text-center">
          <AlertDialogHeader className="items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[color:var(--accent-coral)]/12 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-[color:var(--accent-coral)]" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              {t.logoutConfirm}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {t.logoutDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-5 flex flex-col gap-2 sm:flex-col sm:justify-start">
            <AlertDialogAction
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-[color:var(--accent-coral)] text-white font-bold text-sm hover:opacity-95 transition-colors"
            >
              {t.yesLogout}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              {t.cancel}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WargaPage>
  );
}
