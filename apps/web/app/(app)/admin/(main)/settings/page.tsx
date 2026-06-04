'use client';
import { Button } from '@/components/ui/button';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
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
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
import { authClient } from '@/lib/auth-client';
import { getAdminProfile, type AdminProfile } from '@/lib/admin-profile';
import { platformFetch } from '@/lib/api/platform';

type UserPreference = {
  id: string;
  userId: string;
  language: string;
  theme: string;
  notificationEnabled: boolean;
};

const DICT: Record<string, Record<string, string>> = {
  Indonesia: {
    appearance: 'Tampilan',
    darkMode: 'Mode Gelap',
    active: 'Aktif',
    inactive: 'Nonaktif',
    language: 'Bahasa',
    notifPrivacy: 'Notifikasi & Privasi',
    notif: 'Notifikasi',
    security: 'Keamanan Akun',
    securityDesc: 'Ganti Kata Sandi & verifikasi',
    about: 'Tentang',
    appVersion: 'Versi Aplikasi',
    appAbout: 'Tentang Aplikasi',
    appAboutDesc: 'Info & lisensi',
    logout: 'Keluar dari Akun',
    logoutConfirm: 'Keluar dari Akun?',
    logoutDesc: 'Anda akan dikembalikan ke halaman login admin.',
    yesLogout: 'Ya, Keluar',
    cancel: 'Batal',
  }
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<AdminProfile>(() => getAdminProfile());
  const [isDark, setIsDark] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>('default');
  const [notifikasi, setNotifikasi] = useState(false);
  const [bahasa, setBahasa] = useState('Indonesia');
  const [savingKey, setSavingKey] = useState<'theme' | 'language' | 'notification' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'bahasa' | 'security' | null>(null);

  const t = DICT['Indonesia'];

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const [session, preference] = await Promise.all([
        authClient.getSession().catch(() => null),
        platformFetch<UserPreference>('/me/preferences').catch(() => null),
      ]);
      if (!active) return;
      setProfile(getAdminProfile(session?.data?.user));
      if (preference?.data) {
        setIsDark(preference.data.theme === 'dark');
        setNotifikasi(preference.data.notificationEnabled);
        setBahasa(preference.data.language === 'en' ? 'English' : preference.data.language === 'su' ? 'Sunda' : 'Indonesia');
      }
    }

    void loadSession();

    const checkPermission = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotifStatus(Notification.permission);
      }
    };

    checkPermission();

    window.addEventListener('notif-updated', checkPermission);

    return () => {
      active = false;
      window.removeEventListener('notif-updated', checkPermission);
    };
  }, []);

  const handleToggleNotif = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({ title: 'Tidak Didukung', description: 'Browser Anda tidak mendukung notifikasi.' });
      return;
    }
    if (notifStatus === 'denied') {
      toast({ title: 'Notifikasi Diblokir', description: 'Anda memblokir notifikasi. Silakan ubah di pengaturan browser (ikon gembok 🔒).', variant: 'destructive' });
      return;
    }
    if (notifStatus !== 'granted') {
      const p = await Notification.requestPermission();
      setNotifStatus(p);
      window.dispatchEvent(new CustomEvent('notif-updated'));
      if (p === 'granted') {
        new Notification('Portal RW 25', { body: 'Notifikasi berhasil diaktifkan!', icon: '/favicon.ico' });
      } else {
        return;
      }
    }
    const next = !notifikasi;
    setNotifikasi(next);
    void persistPreference({ notificationEnabled: next }, 'notification');
  };

  const handleLogout = async () => {
    await authClient.signOut().catch(() => null);
    toast({ title: "Berhasil keluar", description: "Anda telah logout.", variant: "default" });
    router.push('/sign-in');
  };

  const persistPreference = async (payload: Partial<Pick<UserPreference, 'theme' | 'language' | 'notificationEnabled'>>, key: 'theme' | 'language' | 'notification') => {
    setSavingKey(key);
    try {
      await platformFetch<UserPreference>('/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch {
      toast({ title: 'Gagal menyimpan preferensi', variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 py-6 w-full">
      <div className="flex items-center gap-4 rounded-[28px] border border-[#D8DEE8] bg-white p-5 shadow-sm">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${profile.avatarClassName} text-2xl font-bold text-white shadow-md`}>
          {profile.initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#18212F]">{profile.name}</h2>
          <p className="text-sm font-medium text-[#667085]">{profile.email}</p>
          <span className="mt-2 inline-block rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold text-[#2563EB]">
            {profile.roleLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Tampilan */}
        <div>
          <h3 className="text-sm font-bold text-[#667085] uppercase tracking-wider mb-2 ml-1">
            {t.appearance}
          </h3>
          <div className="overflow-hidden rounded-[28px] border border-[#D8DEE8] bg-white shadow-sm">
            {/* Dark Mode */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3F0]">
                  {isDark ? <Moon className="h-6 w-6 text-[#1F7A6B]" /> : <Sun className="h-6 w-6 text-[#C26D52]" />}
                </div>
                <div>
                  <p className="text-base font-bold text-[#18212F]">{t.darkMode}</p>
                  <p className="text-sm font-medium text-[#667085]">{isDark ? t.active : t.inactive}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const next = !isDark;
                  setIsDark(next);
                  void persistPreference({ theme: next ? 'dark' : 'light' }, 'theme');
                }}
                disabled={savingKey === 'theme'}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  isDark ? 'bg-[#1F7A6B]' : 'bg-[#D0D5DD]'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 ${
                  isDark ? 'left-[28px]' : 'left-1'
                }`} />
              </Button>
            </div>
            
            <div className="mx-5 h-px bg-[#EEF2F6]" />

            {/* Bahasa */}
            <div 
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setActiveDialog('bahasa')}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6ECE6]">
                  <Globe className="h-6 w-6 text-[#A44A3F]" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#18212F]">{t.language}</p>
                  <p className="text-sm font-medium text-[#667085]">{bahasa}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#98A2B3]" />
            </div>
          </div>
        </div>

        {/* Notifikasi & Privasi */}
        <div>
          <h3 className="text-sm font-bold text-[#667085] uppercase tracking-wider mb-2 ml-1">
            {t.notifPrivacy}
          </h3>
          <div className="overflow-hidden rounded-[28px] border border-[#D8DEE8] bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1F8]">
                  <Bell className="h-6 w-6 text-[#2C5F75]" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#18212F]">{t.notif}</p>
                  <p className="text-sm font-medium text-[#667085]">
                    {notifStatus === 'granted' ? t.active : notifStatus === 'denied' ? 'Diblokir' : t.inactive}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggleNotif}
                disabled={savingKey === 'notification'}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  notifStatus === 'granted' && notifikasi ? 'bg-[#2C5F75]' : 'bg-[#D0D5DD]'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 ${
                  notifStatus === 'granted' && notifikasi ? 'left-[28px]' : 'left-1'
                }`} />
              </Button>
            </div>
            
            <div className="mx-5 h-px bg-[#EEF2F6]" />

            <div 
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setActiveDialog('security')}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F1]">
                  <ShieldCheck className="h-6 w-6 text-[#1F7A6B]" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#18212F]">{t.security}</p>
                  <p className="text-sm font-medium text-[#667085]">{t.securityDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#98A2B3]" />
            </div>
          </div>
        </div>

        {/* Tentang */}
        <div>
          <h3 className="text-sm font-bold text-[#667085] uppercase tracking-wider mb-2 ml-1">
            {t.about}
          </h3>
          <div className="overflow-hidden rounded-[28px] border border-[#D8DEE8] bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6ECE6]">
                  <Smartphone className="h-6 w-6 text-[#A44A3F]" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#18212F]">{t.appVersion}</p>
                  <p className="text-sm font-medium text-[#667085]">v1.0.0 (Build 2026.04)</p>
                </div>
              </div>
            </div>
            
            <div className="mx-5 h-px bg-[#EEF2F6]" />

            <div 
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => document.dispatchEvent(new CustomEvent('open-admin-help'))}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Info className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#18212F]">{t.appAbout}</p>
                  <p className="text-sm font-medium text-[#667085]">{t.appAboutDesc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#98A2B3]" />
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-red-100 bg-red-50 py-4 font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-lg">{t.logout}</span>
        </Button>
      </div>

      {/* Logout Confirm Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="rounded-3xl p-8 text-center max-w-sm">
          <AlertDialogHeader className="items-center text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <LogOut className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-[#18212F]">
              {t.logoutConfirm}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#667085]">
              {t.logoutDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex w-full flex-col gap-3 sm:flex-col sm:justify-center sm:space-x-0">
            <AlertDialogAction
              onClick={handleLogout}
              className="w-full rounded-xl bg-red-600 py-6 text-base font-bold text-white hover:bg-red-700"
            >
              {t.yesLogout}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-xl border-gray-200 py-6 text-base font-bold text-[#64748B] hover:bg-gray-100">
              {t.cancel}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Language / Info Dialogs (Simple implementations for Admin) */}
      <AlertDialog open={activeDialog !== null} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <AlertDialogContent className="rounded-3xl p-6 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#18212F]">
              {activeDialog === 'bahasa' && 'Pilih Bahasa'}
              {activeDialog === 'security' && 'Fitur Segera Hadir'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#667085]">
              {activeDialog === 'bahasa' && 'Pilih bahasa antarmuka sistem.'}
              {activeDialog === 'security' && 'Pengaturan keamanan di halaman ini masih bersifat informasional. Perubahan kredensial dikelola dari alur admin management/backend.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {activeDialog === 'bahasa' && (
            <div className="flex flex-col gap-3 mt-4">
              {['Indonesia', 'Sunda', 'English'].map((l) => (
                <Button
                  key={l}
                  onClick={() => {
                    setBahasa(l);
                    setActiveDialog(null);
                    void persistPreference({ language: l === 'English' ? 'en' : l === 'Sunda' ? 'su' : 'id' }, 'language');
                  }}
                  disabled={savingKey === 'language'}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                    bahasa === l ? 'border-[#1F7A6B] bg-[#E8F3F0] text-[#1F7A6B]' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-bold">{l}</span>
                  {bahasa === l && <Check className="h-5 w-5" />}
                </Button>
              ))}
            </div>
          )}
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="w-full rounded-xl border-gray-200 py-6 text-base font-bold text-[#64748B] hover:bg-gray-100">
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
