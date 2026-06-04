'use client';

import Link from 'next/link';
import {
  CalendarDays,
  ClipboardList,
  FileText,
  MessageSquareText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type QuickActionItem =
  | {
      key: string;
      label: string;
      desc: string;
      href: string;
      icon: LucideIcon;
      soon?: false;
    }
  | {
      key: string;
      label: string;
      desc: string;
      icon: LucideIcon;
      soon: true;
    };

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    key: 'jadwal',
    label: 'Jadwal RW',
    desc: 'Kegiatan & acara',
    href: '/warga/jadwal',
    icon: CalendarDays,
  },
  {
    key: 'riwayat',
    label: 'Riwayat',
    desc: 'Hasil pengecekan',
    href: '/warga/history',
    icon: ClipboardList,
  },
  {
    key: 'aspirasi',
    label: 'Aspirasi',
    desc: 'Status & tanggapan',
    href: '/warga/aspirasi',
    icon: MessageSquareText,
  },
  {
    key: 'layanan',
    label: 'Layanan RT',
    desc: 'Surat & administrasi',
    href: '/warga/layanan',
    icon: FileText,
  },
];

const QUICK_ACTION_TONE_MAP: Record<
  string,
  {
    iconWrap: string;
    icon: string;
    chip: string;
    glow: string;
  }
> = {
  jadwal: {
    iconWrap: 'bg-[color:var(--accent-sky)]/10',
    icon: 'text-[color:var(--accent-sky)]',
    chip: 'bg-[color:var(--accent-sky)]/10 text-[color:var(--accent-sky)]',
    glow: 'bg-[color:var(--accent-sky)]/10',
  },
  riwayat: {
    iconWrap: 'bg-primary/10',
    icon: 'text-primary',
    chip: 'bg-primary/10 text-primary',
    glow: 'bg-primary/10',
  },
  aspirasi: {
    iconWrap: 'bg-[color:var(--accent-violet)]/10',
    icon: 'text-[color:var(--accent-violet)]',
    chip: 'bg-[color:var(--accent-violet)]/10 text-[color:var(--accent-violet)]',
    glow: 'bg-[color:var(--accent-violet)]/10',
  },
  layanan: {
    iconWrap: 'bg-[color:var(--accent-mint)]/10',
    icon: 'text-[color:var(--accent-mint)]',
    chip: 'bg-[color:var(--accent-mint)]/10 text-[color:var(--accent-mint)]',
    glow: 'bg-[color:var(--accent-mint)]/10',
  },
};

interface QuickActionsPanelProps {
  isRestricted: boolean;
}

export default function QuickActionsPanel({
  isRestricted,
}: QuickActionsPanelProps) {
  return (
    <Card className="overflow-hidden rounded-4xl border-0 bg-card shadow-none px-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/70">
            <Sparkles className="size-4 text-primary" />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Aksi cepat
            </p>
            <h2 className="mt-0.5 text-base font-bold tracking-tight text-foreground">
              Menu utama
            </h2>
          </div>
        </div>

        {isRestricted && (
          <Badge
            variant="secondary"
            className="border-0 bg-(--accent-amber)/10 text-(--accent-amber) shadow-none"
          >
            Terbatas
          </Badge>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-3">
            {QUICK_ACTIONS.map((item) => {
              const Icon = item.icon;
              const isSoon = 'soon' in item && item.soon;
              const tone =
                QUICK_ACTION_TONE_MAP[item.key] ?? QUICK_ACTION_TONE_MAP.riwayat;

              const content = (
                <div
                  className={cn(
                    'group relative h-full w-39 overflow-hidden rounded-3xl border-0 bg-background p-3.5 shadow-sm transition-all duration-300',
                    !isSoon &&
                      'hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-md active:scale-[0.98]'
                  )}
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute -right-6 -top-6 size-20 rounded-full blur-2xl transition-opacity duration-300',
                      tone.glow,
                      isSoon ? 'opacity-40' : 'opacity-70 group-hover:opacity-100'
                    )}
                  />

                  <div className="relative flex min-h-[124px] flex-col justify-between">
                    <div>
                      <div
                        className={cn(
                          'mb-3 flex size-11 items-center justify-center rounded-2xl border-0',
                          tone.iconWrap,
                          tone.icon
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </div>

                      <p className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border-0 px-2.5 py-1 text-[10px] font-bold',
                          tone.chip
                        )}
                      >
                        {isSoon ? 'Segera' : 'Buka'}
                      </span>
                    </div>
                  </div>
                </div>
              );

              if ('href' in item && !isSoon) {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="shrink-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  disabled
                  className="shrink-0 cursor-not-allowed rounded-3xl text-left opacity-80"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
