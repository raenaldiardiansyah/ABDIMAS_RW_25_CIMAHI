'use client';

import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_JADWAL } from '@/constants/mockData';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function toIsoDateLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

export default function AdminCalendar() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const monthName = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(today);

  const firstDay = start.getDay();
  const totalDays = end.getDate();

  const cells: Array<{ iso: string; day: number } | null> = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push({
      iso: toIsoDateLocal(new Date(start.getFullYear(), start.getMonth(), day)),
      day,
    });
  }

  const eventsByDate = new Map<string, typeof MOCK_JADWAL>();
  for (const event of MOCK_JADWAL) {
    const list = eventsByDate.get(event.tanggal) ?? [];
    list.push(event);
    eventsByDate.set(event.tanggal, list);
  }

  const todayIso = toIsoDateLocal(today);
  const todayEvents = eventsByDate.get(todayIso) ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-white shadow-lg border border-gray-100">
      {/* Header Calendar */}
      <div className="bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 text-white text-center rounded-t-[32px]">
        <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-90" />
        <h3 className="text-xl font-bold tracking-wide">{monthName}</h3>
        <p className="text-sm font-medium opacity-80 mt-1">Kegiatan RW 025</p>
      </div>

      <div className="flex-1 flex flex-col p-6">
        {/* Calendar Grid */}
        <div className="rounded-[1.5rem] bg-[#F8FAFC] p-4 mb-6">
          <div className="grid grid-cols-7 gap-1">
            {HARI.map((hari) => (
              <div
                key={hari}
                className="py-1.5 text-center text-[11px] font-bold text-[#64748B]"
              >
                {hari}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const iso = cell.iso;
              const isToday = iso === todayIso;
              const hasEvents = eventsByDate.has(iso);

              return (
                <div
                  key={iso}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-xl transition-all',
                    isToday
                      ? 'bg-[#2563EB] text-white shadow-md'
                      : 'text-[#334155] hover:bg-gray-100'
                  )}
                >
                  <span className={cn('text-[13px] font-bold', !isToday && hasEvents && 'text-[#2563EB]')}>
                    {cell.day}
                  </span>
                  {hasEvents && !isToday && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#3B82F6]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Agenda Preview */}
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#334155] mb-4">Agenda Hari Ini</h4>
          {todayEvents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {todayEvents.map((ev) => (
                <div key={ev.id} className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1E293B]">{ev.judul}</p>
                    <p className="text-[11px] font-medium text-[#64748B] mt-0.5">{ev.waktu} • {ev.lokasi}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-gray-200">
              <p className="text-[13px] font-medium text-[#64748B]">Tidak ada kegiatan terjadwal hari ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
