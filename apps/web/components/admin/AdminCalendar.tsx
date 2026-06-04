'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';
import { platformFetch } from '@/lib/api/platform';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

type ScheduleItem = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  location: string;
};

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function toIsoDateLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export default function AdminCalendar() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [events, setEvents] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const month = toIsoDateLocal(today).slice(0, 7);
        const response = await platformFetch<ScheduleItem[]>(`/schedule?month=${month}`);
        if (!active) return;
        setEvents(response.data);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setEvents([]);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const monthName = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(today);

  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const firstDay = start.getDay();
  const totalDays = end.getDate();
  const cells: Array<{ iso: string; day: number } | null> = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) {
    cells.push({
      iso: toIsoDateLocal(new Date(start.getFullYear(), start.getMonth(), day)),
      day,
    });
  }

  const eventsByDate = new Map<string, ScheduleItem[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  const todayIso = toIsoDateLocal(today);
  const todayEvents = eventsByDate.get(todayIso) ?? [];

  return (
    <div className="sticky top-6 flex h-full flex-col overflow-hidden rounded-[24px] border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-lg">
      {/* Header — Blue gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[color:var(--admin-gradient-from)] to-[color:var(--admin-gradient-to)] px-6 py-5 text-center text-primary-foreground">
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/[0.08]" />
        <CalendarDays className="mx-auto mb-2 h-7 w-7 opacity-90" />
        <h3 className="text-lg font-bold tracking-wide">{capitalizedMonth}</h3>
        <p className="mt-0.5 text-xs font-medium opacity-75">Kegiatan RW 025</p>
      </div>

      {/* Calendar grid */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-[color:var(--admin-surface-muted)] p-3">
          <div className="grid grid-cols-7 gap-1">
            {HARI.map((hari) => (
              <div key={hari} className="py-1 text-center text-[11px] font-bold text-[color:var(--admin-muted)]">
                {hari}
              </div>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="aspect-square" />;

              const isToday = cell.iso === todayIso;
              const hasEvents = eventsByDate.has(cell.iso);

              return (
                <div
                  key={cell.iso}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-lg transition-all',
                    isToday
                      ? 'bg-primary text-primary-foreground shadow-md shadow-[color:color-mix(in_srgb,var(--primary),transparent_70%)]'
                      : 'text-[color:var(--admin-body)] hover:bg-[color:var(--admin-surface-soft)]',
                  )}
                >
                  <span
                    className={cn(
                      'text-[12px] font-semibold',
                      !isToday && hasEvents && 'text-primary',
                    )}
                  >
                    {cell.day}
                  </span>
                  {hasEvents && !isToday ? (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[color:var(--admin-gradient-to)]" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <h4 className="mb-3 text-sm font-bold text-[color:var(--admin-body)]">Agenda Hari Ini</h4>
        {todayEvents.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {todayEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex gap-3 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--admin-primary-soft)] text-primary">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[color:var(--admin-heading)]">{ev.title}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-[color:var(--admin-muted)]">
                    {ev.startTime ?? '-'} • {ev.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[color:var(--admin-border)] px-4 py-4 text-center">
            <p className="text-xs font-medium text-[color:var(--admin-muted)]">
              Tidak ada kegiatan terjadwal hari ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
