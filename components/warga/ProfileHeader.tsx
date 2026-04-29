'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Copy, Settings, Moon, Sun, Check } from 'lucide-react';

interface ProfileHeaderProps {
  nama: string;
  nik: string;
  isDark: boolean;
  onToggleDark: () => void;
}

/** Masking NIK: tampilkan hanya 4 digit terakhir */
function maskNik(nik: string): string {
  if (nik.length <= 4) return nik;
  return '**** **** **** ' + nik.slice(-4);
}

export default function ProfileHeader({ nama, nik, isDark, onToggleDark }: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(nik);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = nik;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800/80 transition-colors duration-300">
      <div className="flex items-center gap-3.5">
        {/* Foto Profil */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5c3a21] to-[#a07650] overflow-hidden flex items-center justify-center shadow-md ring-2 ring-white/80 dark:ring-zinc-800">
          <User className="w-5 h-5 text-white/90" />
        </div>

        {/* Info Pengguna */}
        <div className="flex flex-col">
          <h2 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight transition-colors duration-300">
            {nama}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono tracking-wide transition-colors duration-300">
              {maskNik(nik)}
            </span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-[#5c3a21] dark:hover:text-[#c4a07a] transition-colors"
              title="Salin NIK"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Aksi Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/warga/settings"
          className="w-9 h-9 rounded-full bg-gray-50 dark:bg-zinc-800/80 flex items-center justify-center text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-700/80 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all duration-200 shadow-sm"
        >
          <Settings className="w-[15px] h-[15px]" />
        </Link>
        <button
          onClick={onToggleDark}
          className="w-9 h-9 rounded-full bg-gray-50 dark:bg-zinc-800/80 flex items-center justify-center text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-700/80 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all duration-200 shadow-sm"
        >
          {isDark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
        </button>
      </div>
    </header>
  );
}
