'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, ArrowRight, Fingerprint } from 'lucide-react';

type AuthPhase = 'splash' | 'auth';

export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<AuthPhase>('splash');
  const [nikInput, setNikInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'warga' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Splash → Auth setelah 2.5 detik
  useEffect(() => {
    const timer = setTimeout(() => setPhase('auth'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    if (!nikInput.trim()) {
      setError('NIK tidak boleh kosong');
      return;
    }
    if (nikInput.length < 16) {
      setError('NIK harus 16 digit');
      return;
    }
    if (!selectedRole) {
      setError('Pilih peran Anda');
      return;
    }

    setError('');
    setIsLoading(true);

    // Simulasi loading autentikasi
    setTimeout(() => {
      // Simpan data mock ke localStorage
      localStorage.setItem('abdimas-nik', nikInput);
      localStorage.setItem('abdimas-role', selectedRole);
      localStorage.setItem('abdimas-logged', 'true');

      if (selectedRole === 'warga') {
        router.push('/warga');
      } else {
        router.push('/admin');
      }
    }, 1200);
  };

  return (
    <div className="flex justify-center min-h-screen bg-[#5c3a21] font-sans">
      <div className="w-full max-w-md min-h-screen relative overflow-hidden flex flex-col items-center justify-center">

        {/* ═══ FASE: SPLASH ═══════════════════════════════ */}
        <div
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#5c3a21] transition-all duration-700 ${
            phase === 'auth' ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center gap-5 animate-scale-in">
            {/* Logo */}
            <div className="w-24 h-24 rounded-[2rem] bg-white/15 flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md">
              <span className="text-4xl font-black text-white tracking-tight">AM</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-wide">Abdi Masyarakat</h1>
              <p className="text-sm text-white/50 mt-1.5 font-light">Portal Layanan RW 25 Cimahi</p>
            </div>
          </div>

          {/* Shimmer loading bar */}
          <div className="absolute bottom-20 w-52 h-1 rounded-full overflow-hidden bg-white/10">
            <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]" />
          </div>
        </div>

        {/* ═══ FASE: AUTH POPUP ════════════════════════════ */}
        <div
          className={`relative z-10 w-full px-6 transition-all duration-700 delay-300 ${
            phase === 'auth' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Logo kecil di atas */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-lg mb-4">
              <span className="text-2xl font-black text-white tracking-tight">AM</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Masuk ke Akun</h2>
            <p className="text-sm text-white/50 mt-1 font-light">Silakan masukkan NIK dan pilih peran Anda</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/15 shadow-2xl">
            {/* Input NIK */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-white/80 mb-2 block">Nomor Induk Kependudukan</label>
              <div className="relative">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan 16 digit NIK"
                  value={nikInput}
                  onChange={(e) => {
                    setNikInput(e.target.value.replace(/\D/g, '').slice(0, 16));
                    setError('');
                  }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                />
              </div>
              {nikInput.length > 0 && (
                <p className="text-[11px] text-white/40 mt-1.5 ml-1">{nikInput.length}/16 digit</p>
              )}
            </div>

            {/* Pilih Role */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-white/80 mb-2 block">Masuk Sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Warga */}
                <button
                  onClick={() => { setSelectedRole('warga'); setError(''); }}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
                    selectedRole === 'warga'
                      ? 'bg-white/20 border-white/40 shadow-lg scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    selectedRole === 'warga' ? 'bg-white/25' : 'bg-white/10'
                  }`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${selectedRole === 'warga' ? 'text-white' : 'text-white/70'}`}>
                    Warga
                  </span>
                  <span className="text-[10px] text-white/40 leading-tight text-center">Portal layanan warga</span>
                </button>

                {/* Admin */}
                <button
                  onClick={() => { setSelectedRole('admin'); setError(''); }}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
                    selectedRole === 'admin'
                      ? 'bg-white/20 border-white/40 shadow-lg scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    selectedRole === 'admin' ? 'bg-white/25' : 'bg-white/10'
                  }`}>
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${selectedRole === 'admin' ? 'text-white' : 'text-white/70'}`}>
                    Admin
                  </span>
                  <span className="text-[10px] text-white/40 leading-tight text-center">Panel administrasi</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/25">
                <p className="text-xs text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Tombol Login */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide bg-white text-[#5c3a21] hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#5c3a21]/30 border-t-[#5c3a21] rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-white/30 mt-6">
            © 2026 Abdi Masyarakat — RW 25 Kota Cimahi
          </p>
        </div>

        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/3 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/3 rounded-full -ml-20 -mb-20 blur-3xl" />
      </div>
    </div>
  );
}
