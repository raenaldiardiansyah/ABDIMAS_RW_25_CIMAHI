'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Landmark, MessageSquare } from 'lucide-react';

import { platformFetch } from '@/lib/api/platform';
import { useAutoRefresh } from '@/lib/use-auto-refresh';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type ReplyItem = {
  id: string;
  title: string;
  category: string | null;
  status: 'SUBMITTED' | 'REVIEWED' | 'RESOLVED';
  adminReply: {
    message: string;
    repliedAt: string;
    repliedById: string;
    repliedByName: string;
  } | null;
};

const CATEGORY_TONE: Record<
  string,
  {
    chip: string;
    soft: string;
    dot: string;
  }
> = {
  masukan: {
    chip: 'text-[color:var(--accent-sky)] bg-[color:var(--accent-sky)]/10',
    soft: 'bg-[color:var(--accent-sky)]/8',
    dot: 'bg-[color:var(--accent-sky)]',
  },
  keluhan: {
    chip: 'text-[color:var(--accent-amber)] bg-[color:var(--accent-amber)]/10',
    soft: 'bg-[color:var(--accent-amber)]/8',
    dot: 'bg-[color:var(--accent-amber)]',
  },
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 60_000) return 'Baru saja';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return new Date(iso).toLocaleDateString('id-ID');
}

export default function CommentCarousel({ refreshKey = 0 }: { refreshKey?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ReplyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await platformFetch<ReplyItem[]>('/aspirations?page=1&limit=20&repliedOnly=true');
        if (!active) return;
        setItems(response.data.filter((item) => item.adminReply));
      } catch {
        if (!active) return;
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  useAutoRefresh(async () => {
    const response = await platformFetch<ReplyItem[]>('/aspirations?page=1&limit=20&repliedOnly=true');
    setItems(response.data.filter((item) => item.adminReply));
    setLoading(false);
  }, {
    intervalMs: 10000,
  });

  const visibleItems = useMemo(() => items.slice(0, 20), [items]);

  return (
    <Card className="w-full overflow-hidden rounded-4xl border-0 bg-card px-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/70">
            <MessageSquare className="size-4 text-primary" />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Tanggapan
            </p>
            <h3 className="mt-0.5 text-base font-bold tracking-tight text-foreground">
              Update laporan Anda
            </h3>
          </div>
        </div>

        <Link
          href="/warga/aspirasi"
          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          Lihat semua
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        {loading ? (
          <div className="rounded-3xl bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Memuat tanggapan...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-3xl bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada tanggapan admin untuk laporan Anda.
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div ref={scrollRef} className="flex w-max gap-3 scroll-smooth">
              {visibleItems.map((item) => {
                const categoryKey = item.category?.toLowerCase() ?? 'masukan';
                const tone = CATEGORY_TONE[categoryKey] ?? CATEGORY_TONE.masukan;

                return (
                  <article
                    key={item.id}
                    className="group relative w-[84%] max-w-82.5 shrink-0 overflow-hidden rounded-3xl bg-muted/30 p-4 shadow-sm transition-all duration-300 hover:bg-muted/45 hover:shadow-md active:scale-[0.98]"
                  >
                    <div
                      className={cn(
                        'pointer-events-none absolute -right-6 -top-6 size-24 rounded-full blur-2xl transition-opacity duration-300',
                        tone.dot,
                        'opacity-0 group-hover:opacity-25',
                      )}
                      aria-hidden="true"
                    />

                    <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                            tone.chip,
                          )}
                        >
                          {item.category ?? 'Laporan'}
                        </span>

                        <h4 className="mt-2 line-clamp-1 text-sm font-bold text-foreground">
                          {item.title}
                        </h4>
                      </div>

                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                        {item.adminReply ? relativeTime(item.adminReply.repliedAt) : '-'}
                      </span>
                    </div>

                    <div className={cn('relative z-10 rounded-2xl p-3', tone.soft)}>
                      <p className="line-clamp-3 text-xs leading-relaxed text-foreground/80">
                        "{item.adminReply?.message ?? '-'}"
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full',
                            tone.dot,
                          )}
                        >
                          <Landmark className="size-3.5 text-primary-foreground" aria-hidden="true" />
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold leading-none text-foreground">
                            {item.adminReply?.repliedByName ?? 'Admin RW 25'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {item.status === 'RESOLVED' ? 'Laporan selesai' : 'Tanggapan admin'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
