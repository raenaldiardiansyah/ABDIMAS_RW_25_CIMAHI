'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Copy, Settings, Moon, Sun, Check, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  nama: string;
  nik: string;
  isDark: boolean;
  onToggleDark: () => void;
  statusBadge?: { label: string; variant: "warning" | "error" };
}

/** Masking NIK: tampilkan hanya 4 digit terakhir */
function maskNik(nik: string): string {
  if (nik.length <= 4) return nik;
  return '**** **** **** ' + nik.slice(-4);
}

export default function ProfileHeader({ nama, nik, isDark, onToggleDark, statusBadge }: ProfileHeaderProps) {
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
    <header className="safe-top flex items-center justify-between border-b border-input px-5 pb-4 transition-colors duration-300">
      <div className="flex items-center gap-3.5">
        {/* Foto Profil */}
        <div className="relative w-11 h-11 rounded-full bg-primary overflow-hidden flex items-center justify-center shadow-sm ring-2 ring-white/80">
          <div className="batik-primary-overlay" />
          <User className="relative z-10 w-5 h-5 text-white/90" />
        </div>

        {/* Info Pengguna */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors duration-300">
            <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Portal RW 25 Cimahi</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-[15px] font-bold text-foreground leading-tight tracking-tight transition-colors duration-300">
              {nama}
            </h2>
            {statusBadge && (
              <Badge
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  statusBadge.variant === "warning"
                    ? "bg-[color:var(--accent-amber)]/14 text-[color:var(--accent-amber)] border-[color:var(--accent-amber)]/35"
                    : "bg-[color:var(--accent-coral)]/14 text-[color:var(--accent-coral)] border-[color:var(--accent-coral)]/35"
                }`}
              >
                {statusBadge.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground font-mono tracking-wide transition-colors duration-300">
              {maskNik(nik)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-auto w-auto text-muted-foreground hover:text-foreground transition-colors"
              title="Salin NIK"
            >
              {copied ? (
                <Check className="w-3 h-3 text-[color:var(--accent-mint)]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Aksi Header */}
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="w-9 h-9 rounded-full bg-card text-muted-foreground border-input hover:text-primary"
        >
          <Link href="/warga/settings">
            <Settings className="w-[15px] h-[15px]" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggleDark}
          className="w-9 h-9 rounded-full bg-card text-muted-foreground border-input hover:text-primary"
        >
          {isDark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
        </Button>
      </div>
    </header>
  );
}
