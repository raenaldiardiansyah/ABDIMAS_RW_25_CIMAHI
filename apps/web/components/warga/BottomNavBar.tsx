'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, History, Home, UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/warga', label: 'Home', icon: Home },
  { href: '/warga/history', label: 'Riwayat', icon: History },
  { href: '/warga/jadwal', label: 'Jadwal', icon: Calendar },
  { href: '/warga/settings', label: 'Profil', icon: UserRound },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed bottom-[max(env(safe-area-inset-bottom,0px),1.25rem)] left-1/2 z-50 w-full max-w-105 -translate-x-1/2 px-4">
      <nav className="pointer-events-auto mx-auto flex items-center justify-between gap-1 
          h-16 w-full max-w-md 
          rounded-full border border-border 
          bg-background p-1.5 
          shadow-md backdrop-blur">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== '/warga' && pathname.startsWith(item.href));

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'h-16 rounded-full px-0 transition-all duration-300 ease-out',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',

                isActive
                  ? 'w-auto min-w-28 justify-start gap-2 bg-primary px-5 text-primary-foreground shadow-md hover:bg-primary hover:text-primary-foreground'
                  : 'w-14 text-muted-foreground'
              )}
            >
              <Link
                href={item.href}
                aria-label={item.label}
                className="flex h-full w-full items-center justify-center gap-2"
              >
                <Icon className="h-5 w-5 shrink-0" />

                {isActive && (
                  <span className="text-sm font-semibold tracking-tight">
                    {item.label}
                  </span>
                )}
              </Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}