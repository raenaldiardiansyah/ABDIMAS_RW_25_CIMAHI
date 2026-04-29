'use client';

import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { MOCK_JADWAL, KATEGORI_COLORS } from '@/constants/mockData';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function JadwalPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Tanggal-tanggal yang punya event
  const eventDates = useMemo(() => {
    const set = new Set<string>();
    MOCK_JADWAL.forEach((e) => set.add(e.tanggal));
    return set;
  }, []);

  // Event di tanggal yang dipilih
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return MOCK_JADWAL.slice(0, 5); // Tampilkan semua upcoming jika belum pilih
    return MOCK_JADWAL.filter((e) => e.tanggal === selectedDate);
  }, [selectedDate]);

  // Kalender grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];

    // Hari kosong di awal
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Hari-hari bulan ini
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const getDateStr = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#5c3a21]/10 dark:bg-[#c4a07a]/10 flex items-center justify-center">
            <CalendarDays className="w-[18px] h-[18px] text-[#5c3a21] dark:text-[#c4a07a]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Jadwal RW</h1>
            <p className="text-[12px] text-gray-400 dark:text-zinc-500">Kegiatan & acara RW 025</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pb-6">
        {/* Kalender */}
        <div className="bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/60 p-4 mb-4 shadow-sm">
          {/* Navigasi Bulan */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {BULAN[currentMonth]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Header Hari */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {HARI.map((h) => (
              <div key={h} className="text-center text-[11px] font-semibold text-gray-400 dark:text-zinc-500 py-1">
                {h}
              </div>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;

              const dateStr = getDateStr(day);
              const hasEvent = eventDates.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`
                    relative w-full aspect-square rounded-xl flex flex-col items-center justify-center text-[13px] font-medium transition-all duration-200
                    ${isSelected
                      ? 'bg-[#5c3a21] text-white shadow-md scale-105'
                      : isTodayDate
                        ? 'bg-[#5c3a21]/10 text-[#5c3a21] dark:bg-[#c4a07a]/15 dark:text-[#c4a07a] font-bold'
                        : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50'
                    }
                  `}
                >
                  {day}
                  {hasEvent && (
                    <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#5c3a21] dark:bg-[#c4a07a]'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daftar Kegiatan */}
        <div className="mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            {selectedDate
              ? `Kegiatan ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Kegiatan Mendatang'
            }
          </h3>

          {selectedEvents.length > 0 ? (
            <div className="flex flex-col gap-2.5 stagger-children">
              {selectedEvents.map((event) => {
                const cat = KATEGORI_COLORS[event.kategori] || KATEGORI_COLORS.lainnya;
                return (
                  <div
                    key={event.id}
                    className="relative bg-white dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/60 p-4 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Left Colored Line */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${cat.dot}`} />

                    <div className="flex items-start gap-3">
                      {/* Dot Kategori */}
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cat.dot}`} />

                      <div className="flex-1 min-w-0">
                        {/* Badge Kategori */}
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${cat.bg} ${cat.text} dark:bg-opacity-20`}>
                          {event.kategori.charAt(0).toUpperCase() + event.kategori.slice(1)}
                        </span>

                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{event.judul}</h4>

                        {event.deskripsi && (
                          <p className="text-[12px] text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                            {event.deskripsi}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-2.5">
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <span>{event.waktu}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500">
                            <MapPin className="w-3 h-3" />
                            <span>{event.lokasi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <CalendarDays className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500">Tidak Ada Kegiatan</p>
              <p className="text-xs text-gray-300 dark:text-zinc-600 mt-1">
                Tidak ada kegiatan pada tanggal ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
