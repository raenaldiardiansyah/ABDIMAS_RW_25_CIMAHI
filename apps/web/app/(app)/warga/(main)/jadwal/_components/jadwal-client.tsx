'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { platformFetch } from '@/lib/api/platform';
import { formatActivityTimeRange } from '@/lib/activity-time';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const CATEGORY_LABEL: Record<string, string> = {
  bansos: 'Bansos',
  administrasi: 'Admin',
  sosial: 'Sosial',
  lainnya: 'Lainnya',
};

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function toIsoDateLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function parseIsoDateLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatMonthYearId(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatFullDateId(isoDate: string) {
  const date = parseIsoDateLocal(isoDate);

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function buildMonthGrid(activeMonth: Date) {
  const start = monthStart(activeMonth);
  const end = monthEnd(activeMonth);

  const firstDay = start.getDay();
  const totalDays = end.getDate();

  const cells: Array<{ iso: string; day: number } | null> = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push({
      iso: toIsoDateLocal(
        new Date(start.getFullYear(), start.getMonth(), day)
      ),
      day,
    });
  }

  return cells;
}

function getCategoryLabel(category: string) {
  return CATEGORY_LABEL[category] ?? CATEGORY_LABEL.lainnya;
}

export default function JadwalClient() {
  const todayIso = toIsoDateLocal(new Date());

  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [activeMonth] = useState(() => monthStart(parseIsoDateLocal(todayIso)));
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<Array<{
    id: string;
    tanggal: string;
    judul: string;
    waktu: string;
    lokasi: string;
    kategori: 'rapat' | 'sosial' | 'kesehatan' | 'keamanan' | 'lainnya';
    deskripsi?: string;
  }>>([]);

  const updatedAtLabel = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  useEffect(() => {
    let mounted = true;

    platformFetch<
      Array<{
        id: string;
        title: string;
        description: string;
        location: string;
        category: 'rapat' | 'sosial' | 'kesehatan' | 'keamanan' | 'lainnya';
        date: string;
        startTime?: string | null;
        endTime?: string | null;
      }>
    >(`/schedule?month=${todayIso.slice(0, 7)}`)
      .then(({ data }) => {
        if (!mounted) return;
        setEvents(
          data.map((item) => ({
            id: item.id,
            tanggal: item.date,
            judul: item.title,
            waktu: formatActivityTimeRange(item.startTime, item.endTime),
            lokasi: item.location,
            kategori: item.category,
            deskripsi: item.description,
          })),
        );
      })
      .catch(() => {
        if (!mounted) return;
      });

    return () => {
      mounted = false;
    };
  }, [todayIso]);

  const monthCells = useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();

    for (const event of events) {
      const list = map.get(event.tanggal) ?? [];
      list.push(event);
      map.set(event.tanggal, list);
    }

    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    const base = eventsByDate.get(selectedIso) ?? [];

    if (!query.trim()) return base;

    const q = query.trim().toLowerCase();

    return base.filter((event) => {
      return (
        event.judul.toLowerCase().includes(q) ||
        event.lokasi.toLowerCase().includes(q) ||
        event.kategori.toLowerCase().includes(q)
      );
    });
  }, [eventsByDate, selectedIso, query]);

  return (
    <WargaPage>
      <PageHeader
        title="Jadwal RW 025"
        eyebrow="Sistem Informasi Desa"
        description={formatMonthYearId(activeMonth)}
        variant="brand"
        className="pb-7"
        titleClassName="text-xl"
        rightSlot={
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="mt-1 rounded-full bg-white text-primary-foreground shadow-sm hover:bg-primary-foreground/15"
            aria-label="Cari jadwal"
          >
            <Search className="size-4" aria-hidden="true" />
          </Button>
        }
        bottomSlot={
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 shadow-sm">
              <CalendarDays className="size-7 text-primary-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-tight text-primary-foreground">
                Agenda Kegiatan Warga
              </p>
              <p className="mt-1 text-xs text-primary-foreground/75">
                Data resmi RW 025
              </p>
            </div>
          </div>
        }
      />

      <WargaPageBody className="flex flex-col gap-5">
        <Card className="overflow-hidden rounded-4xl border-border/70 bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="mb-4 pt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Kalender
                </p>
                <h2 className="mt-0.5 text-base font-bold tracking-tight text-foreground">
                  {formatMonthYearId(activeMonth)}
                </h2>
              </div>

              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
              >
                {eventsByDate.size} tanggal
              </Badge>
            </div>

            <div className="rounded-[1.5rem] bg-muted/40 p-3">
              <div className="grid grid-cols-7 gap-1">
                {HARI.map((hari) => (
                  <div
                    key={hari}
                    className="py-1.5 text-center text-[10px] font-semibold text-muted-foreground"
                  >
                    {hari}
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {monthCells.map((cell, idx) => {
                  if (!cell) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="aspect-square rounded-2xl"
                      />
                    );
                  }

                  const iso = cell.iso;
                  const isSelected = iso === selectedIso;
                  const isToday = iso === todayIso;
                  const events = eventsByDate.get(iso) ?? [];
                  const hasEvents = events.length > 0;

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedIso(iso)}
                      className={cn(
                        'relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                          : 'text-foreground hover:bg-background hover:shadow-xs'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[13px] font-bold tabular-nums',
                          !isSelected && isToday && 'text-primary'
                        )}
                      >
                        {cell.day}
                      </span>

                      <span className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                        {hasEvents ? (
                          events.slice(0, 3).map((event) => (
                            <span
                              key={`${iso}-${event.id}`}
                              className={cn(
                                'size-1.5 rounded-full',
                                isSelected
                                  ? 'bg-primary-foreground/80'
                                  : 'bg-primary'
                              )}
                            />
                          ))
                        ) : (
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              isToday && !isSelected
                                ? 'bg-primary/60'
                                : 'bg-transparent'
                            )}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-4xl border-border/70 bg-card shadow-sm">
          <CardHeader className="space-y-4 border-b border-border/70 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Kegiatan terjadwal
                </p>
                <h2 className="mt-1 text-sm font-bold leading-snug text-foreground">
                  {formatFullDateId(selectedIso)}
                </h2>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Pembaruan terakhir: {updatedAtLabel}
                </p>
              </div>

              <Badge
                variant="outline"
                className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
              >
                {selectedEvents.length} agenda
              </Badge>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kegiatan, lokasi, atau kategori"
                className="h-10 rounded-2xl border-border bg-background pl-9 text-xs shadow-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {selectedEvents.length > 0 ? (
              <div className="divide-y divide-border/70">
                {selectedEvents.map((event) => {
                  const categoryLabel = getCategoryLabel(event.kategori);

                  return (
                    <article
                      key={event.id}
                      className="px-4 py-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <CalendarDays className="size-4" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                            >
                              {categoryLabel}
                            </Badge>

                            <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                              {event.waktu}
                            </span>
                          </div>

                          <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
                            {event.judul}
                          </h3>

                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {event.lokasi}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
                  <CalendarDays className="size-6" aria-hidden="true" />
                </div>

                <p className="mt-4 text-sm font-bold text-foreground">
                  Tidak ada kegiatan
                </p>
                <p className="mx-auto mt-1 max-w-60 text-xs leading-relaxed text-muted-foreground">
                  Pilih tanggal lain atau ubah kata kunci pencarian.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </WargaPageBody>
    </WargaPage>
  );
}
