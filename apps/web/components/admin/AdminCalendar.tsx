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
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-lg">
      <div className="rounded-t-[32px] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 text-center text-white">
        <CalendarDays className="mx-auto mb-2 h-8 w-8 opacity-90" />
        <h3 className="text-xl font-bold tracking-wide">{monthName}</h3>
        <p className="mt-1 text-sm font-medium opacity-80">Kegiatan RW 025</p>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6 rounded-[1.5rem] bg-[#F8FAFC] p-4">
          <div className="grid grid-cols-7 gap-1">
            {HARI.map((hari) => (
              <div key={hari} className="py-1.5 text-center text-[11px] font-bold text-[#64748B]">
                {hari}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="aspect-square" />;

              const isToday = cell.iso === todayIso;
              const hasEvents = eventsByDate.has(cell.iso);

              return (
                <div
                  key={cell.iso}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-xl transition-all',
                    isToday ? 'bg-[#2563EB] text-white shadow-md' : 'text-[#334155] hover:bg-gray-100',
                  )}
                >
                  <span className={cn('text-[13px] font-bold', !isToday && hasEvents && 'text-[#2563EB]')}>
                    {cell.day}
                  </span>
                  {hasEvents && !isToday ? (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#3B82F6]" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <h4 className="mb-4 text-sm font-bold text-[#334155]">Agenda Hari Ini</h4>
          {todayEvents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {todayEvents.map((ev) => (
                <div key={ev.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1E293B]">{ev.title}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#64748B]">
                      {ev.startTime ?? '-'} • {ev.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center">
              <p className="text-[13px] font-medium text-[#64748B]">Tidak ada kegiatan terjadwal hari ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
