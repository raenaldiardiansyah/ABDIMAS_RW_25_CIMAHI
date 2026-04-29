'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Calendar } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/warga', label: 'Beranda', icon: Home },
  { href: '/warga/history', label: 'Riwayat', icon: History },
  { href: '/warga/jadwal', label: 'Jadwal', icon: Calendar },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-max max-w-[92%] z-40">
      <nav className="bg-[var(--brand-dark)] p-2 rounded-full shadow-[0_16px_48px_rgba(0,0,0,0.3)] flex items-center gap-1.5 border border-white/10 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              {isActive ? (
                <div className="flex items-center gap-3 bg-[var(--brand-mid)] px-5 py-3 rounded-full text-white transition-all duration-300 shadow-inner border border-white/5">
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-[13px] font-semibold tracking-wide">{item.label}</span>
                </div>
              ) : (
                <div className="w-12 h-12 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/8 transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
