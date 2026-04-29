'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../layout';
import {
  ArrowLeft,
  User,
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
import { MOCK_USER } from '@/constants/mockData';
import SlideUpSheet from '@/components/warga/SlideUpSheet';
import StatusPopup from '@/components/warga/StatusPopup';

const DICT: Record<string, any> = {
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
  const [notifikasi, setNotifikasi] = useState(true);
  const [bahasa, setBahasa] = useState('Indonesia');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [activeSheet, setActiveSheet] = useState<'bahasa' | 'tentang' | null>(null);
  const [popup, setPopup] = useState<{ variant: 'success' | 'warning' | 'error', judul: string, deskripsi?: string } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('abdimas-logged');
    localStorage.removeItem('abdimas-role');
    localStorage.removeItem('abdimas-nik');
    router.push('/');
  };

  const handleBahasaSelect = (lang: string) => {
    setBahasa(lang);
    setActiveSheet(null);
  };

  const t = DICT[bahasa] || DICT['Indonesia'];

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-gray-100 dark:border-zinc-800/80 transition-colors duration-300">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">{t.title}</h1>
      </div>

      <div className="flex-1 px-5 py-5 pb-6 flex flex-col gap-5">

        {/* ── Profil ──────────────────────────────────────── */}
        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-5 flex items-center gap-4 border border-gray-100 dark:border-zinc-700/60 transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5c3a21] to-[#a07650] flex items-center justify-center shadow-md">
            <User className="w-7 h-7 text-white/90" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white transition-colors duration-300">{MOCK_USER.nama}</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono mt-0.5 transition-colors duration-300">NIK: {MOCK_USER.nik}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 transition-colors duration-300">
              RT {MOCK_USER.rt} / RW {MOCK_USER.rw} — {MOCK_USER.alamat}
            </p>
          </div>
        </div>

        {/* ── Tampilan ────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 ml-1 transition-colors duration-300">
            {t.appearance}
          </p>
          <div className="bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/60 overflow-hidden transition-colors duration-300">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                  {isDark ? <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 transition-colors duration-300">{t.darkMode}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 transition-colors duration-300">{isDark ? t.active : t.inactive}</p>
                </div>
              </div>
              <button
                onClick={toggleDark}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  isDark ? 'bg-[#5c3a21]' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  isDark ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-zinc-700/50 mx-4" />

            {/* Bahasa */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
              onClick={() => setActiveSheet('bahasa')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 transition-colors duration-300">{t.language}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 transition-colors duration-300">{bahasa}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600" />
            </div>
          </div>
        </div>

        {/* ── Notifikasi & Privasi ─────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 ml-1 transition-colors duration-300">
            {t.notifPrivacy}
          </p>
          <div className="bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/60 overflow-hidden transition-colors duration-300">
            {/* Notifikasi Toggle */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 transition-colors duration-300">{t.notif}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 transition-colors duration-300">{notifikasi ? t.active : t.inactive}</p>
                </div>
              </div>
              <button
                onClick={() => setNotifikasi(!notifikasi)}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  notifikasi ? 'bg-[#5c3a21]' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  notifikasi ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-zinc-700/50 mx-4" />

            {/* Keamanan */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
              onClick={() => setPopup({ 
                variant: 'warning', 
                judul: 'Fitur Segera Hadir', 
                deskripsi: 'Pengaturan keamanan akun sedang dalam tahap pengembangan.' 
              })}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 transition-colors duration-300">{t.security}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 transition-colors duration-300">{t.securityDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600" />
            </div>
          </div>
        </div>

        {/* ── Tentang ─────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 ml-1 transition-colors duration-300">
            {t.about}
          </p>
          <div className="bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/60 overflow-hidden transition-colors duration-300">
            {/* Versi Aplikasi */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
              onClick={() => setPopup({ 
                variant: 'success', 
                judul: 'Versi Terbaru', 
                deskripsi: 'Anda sudah menggunakan aplikasi versi terbaru (v1.0.0).' 
              })}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 transition-colors duration-300">{t.appVersion}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 transition-colors duration-300">v1.0.0 (Build 2026.04)</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-zinc-700/50 mx-4" />

            {/* Tentang Aplikasi */}
            <div 
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
              onClick={() => setActiveSheet('tentang')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-700/50 flex items-center justify-center">
                  <Info className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 transition-colors duration-300">{t.appAbout}</p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 transition-colors duration-300">{t.appAboutDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600" />
            </div>
          </div>
        </div>

        {/* ── Tombol Keluar ───────────────────────────────── */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>

        <p className="text-center text-[11px] text-gray-300 dark:text-zinc-600 transition-colors duration-300">
          © 2026 Abdi Masyarakat — RW 25 Kota Cimahi
        </p>
      </div>

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
            <button
              key={lang}
              onClick={() => handleBahasaSelect(lang)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                bahasa === lang 
                  ? 'border-[#5c3a21] bg-[#5c3a21]/5 dark:border-[#c4a07a] dark:bg-[#c4a07a]/10' 
                  : 'border-gray-100 bg-white hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800'
              }`}
            >
              <span className={`text-sm font-semibold ${
                bahasa === lang ? 'text-[#5c3a21] dark:text-[#c4a07a]' : 'text-gray-700 dark:text-zinc-300'
              }`}>
                {lang}
              </span>
              {bahasa === lang && <Check className="w-5 h-5 text-[#5c3a21] dark:text-[#c4a07a]" />}
            </button>
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
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#5c3a21] to-[#a07650] flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">RW</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Portal RW 25</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Aplikasi ini dikembangkan untuk memudahkan warga RW 25 Kota Cimahi dalam mengakses informasi dan layanan administrasi tingkat RT/RW.
            </p>
          </div>
          <div className="w-full h-px bg-gray-100 dark:bg-zinc-800 my-2" />
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Dibuat dengan ❤️ oleh Tim Abdi Masyarakat
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
            <button 
              onClick={() => setPopup(null)} 
              className="w-full py-3 rounded-xl text-sm font-bold text-center bg-[#5c3a21] text-white hover:bg-[#4a2f1a] transition-colors"
            >
              {t.understand}
            </button>
          }
        >
          {popup.deskripsi && (
            <p className="text-center text-sm text-gray-600 dark:text-zinc-400 mt-2">
              {popup.deskripsi}
            </p>
          )}
        </StatusPopup>
      )}

      {/* ═══ Popup Konfirmasi Logout ═══════════════════════ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl animate-scale-in overflow-hidden p-6 text-center transition-colors duration-300">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{t.logoutConfirm}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5 transition-colors duration-300">
              {t.logoutDesc}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
              >
                {t.yesLogout}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
