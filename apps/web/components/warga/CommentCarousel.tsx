'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, Landmark, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const MOCK_COMMENTS = [
  {
    id: 1,
    name: 'Budi Santoso',
    category: 'Infrastruktur',
    report: 'Jalan berlubang di RT 03',
    comment:
      'Sudah dikoordinasikan dengan dinas PU, akan diperbaiki minggu depan.',
    time: '2 jam yang lalu',
  },
  {
    id: 2,
    name: 'Siti Aminah',
    category: 'Fasilitas Umum',
    report: 'Lampu jalan mati',
    comment:
      'Petugas sudah ke lokasi untuk pengecekan dan penggantian lampu.',
    time: '5 jam yang lalu',
  },
  {
    id: 3,
    name: 'Ahmad Riyadi',
    category: 'Kebersihan',
    report: 'Tumpukan sampah di pinggir kali',
    comment: 'Jadwal pengangkutan sampah tambahan sedang diatur.',
    time: '1 hari yang lalu',
  },
  {
    id: 4,
    name: 'Rina Kusuma',
    category: 'Keamanan',
    report: 'Pos ronda butuh perbaikan atap',
    comment:
      'Dana swadaya sudah terkumpul, perbaikan dimulai akhir bulan ini.',
    time: '2 hari yang lalu',
  },
];

const CATEGORY_TONE: Record<
  string,
  {
    chip: string;
    soft: string;
    dot: string;
  }
> = {
  Infrastruktur: {
    chip: 'text-[color:var(--accent-sky)] bg-[color:var(--accent-sky)]/10',
    soft: 'bg-[color:var(--accent-sky)]/8',
    dot: 'bg-[color:var(--accent-sky)]',
  },
  'Fasilitas Umum': {
    chip: 'text-[color:var(--accent-mint)] bg-[color:var(--accent-mint)]/10',
    soft: 'bg-[color:var(--accent-mint)]/8',
    dot: 'bg-[color:var(--accent-mint)]',
  },
  Kebersihan: {
    chip: 'text-[color:var(--accent-amber)] bg-[color:var(--accent-amber)]/10',
    soft: 'bg-[color:var(--accent-amber)]/8',
    dot: 'bg-[color:var(--accent-amber)]',
  },
  Keamanan: {
    chip:
      'text-[color:var(--accent-violet)] bg-[color:var(--accent-violet)]/10',
    soft: 'bg-[color:var(--accent-violet)]/8',
    dot: 'bg-[color:var(--accent-violet)]',
  },
};

export default function CommentCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Card className="w-full overflow-hidden rounded-4xl border-0 bg-card shadow-none px-0">
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
              Update laporan warga
            </h3>
          </div>
        </div>

        <Link
          href="/warga/history"
          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          Lihat semua
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div ref={scrollRef} className="flex w-max gap-3 scroll-smooth">
            {MOCK_COMMENTS.map((item) => {
              const tone =
                CATEGORY_TONE[item.category] ?? CATEGORY_TONE.Infrastruktur;

              return (
                <article
                  key={item.id}
                  className="group relative w-[84%] max-w-82.5 shrink-0 overflow-hidden rounded-3xl border-0 bg-muted/30 p-4 shadow-sm transition-all duration-300 hover:bg-muted/45 hover:shadow-md active:scale-[0.98]"
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
                          'inline-flex rounded-full border-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                          tone.chip
                        )}
                      >
                        {item.category}
                      </span>

                      <h4 className="mt-2 line-clamp-1 text-sm font-bold text-foreground">
                        {item.report}
                      </h4>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Oleh {item.name}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                      {item.time}
                    </span>
                  </div>

                  <div className={cn('relative z-10 rounded-2xl border-0 p-3', tone.soft)}>
                    <p className="line-clamp-3 text-xs leading-relaxed text-foreground/80">
                      “{item.comment}”
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className={cn(
                          'flex size-6 items-center justify-center rounded-full',
                          tone.dot
                        )}
                      >
                        <Landmark
                          className="size-3.5 text-primary-foreground"
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold leading-none text-foreground">
                          Admin RW 25
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Pemerintah Desa
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
