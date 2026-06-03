'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Clock, Search, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { platformFetch } from '@/lib/api/platform';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type EventCategory = 'rapat' | 'kesehatan' | 'sosial' | 'keamanan' | 'lainnya';

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: EventCategory;
  date: string;
  startTime: string | null;
  endTime: string | null;
};

const KATEGORI_COLORS: Record<EventCategory, { bg: string; text: string; dot: string }> = {
  rapat: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  kesehatan: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sosial: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  keamanan: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  lainnya: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export default function KegiatanPage() {
  const [jadwal, setJadwal] = useState<ActivityItem[]>([]);
  const [filterKategori, setFilterKategori] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJudul, setNewJudul] = useState('');
  const [newKategori, setNewKategori] = useState<EventCategory>('rapat');
  const [newTanggal, setNewTanggal] = useState('');
  const [newWaktu, setNewWaktu] = useState('');
  const [newLokasi, setNewLokasi] = useState('');
  const [newDeskripsi, setNewDeskripsi] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await platformFetch<ActivityItem[]>('/admin/activities');
        if (!active) return;
        setJadwal(response.data);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setJadwal([]);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredJadwal = jadwal.filter((event) => {
    const matchCat = filterKategori === 'semua' || event.category === filterKategori;
    const matchSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul || !newTanggal || !newWaktu || !newLokasi || !newDeskripsi) return;

    try {
      const response = await platformFetch<ActivityItem>('/admin/activities', {
        method: 'POST',
        body: JSON.stringify({
          title: newJudul,
          description: newDeskripsi,
          location: newLokasi,
          category: newKategori,
          date: newTanggal,
          startTime: newWaktu,
          endTime: null,
        }),
      });

      setJadwal((prev) => [response.data, ...prev]);
      setIsModalOpen(false);
      setNewJudul('');
      setNewKategori('rapat');
      setNewTanggal('');
      setNewWaktu('');
      setNewLokasi('');
      setNewDeskripsi('');
    } catch (error) {
      console.error(error);
    }
  };

  const categories = ['semua', 'rapat', 'kesehatan', 'sosial', 'keamanan', 'lainnya'] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(18px,2vw,24px)] font-bold text-[#1E293B]">Agenda Kegiatan RW</h2>
          <p className="mt-1 text-sm text-[#64748B]">Kelola dan pantau seluruh jadwal kegiatan di lingkungan RW 25</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          Tambah Kegiatan
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setFilterKategori(cat)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all',
                filterKategori === cat
                  ? 'bg-[#3B82F6] text-white shadow-md'
                  : 'bg-gray-100 text-[#64748B] hover:bg-gray-200',
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari kegiatan..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[#3B82F6] focus:bg-white"
          />
        </div>
      </div>

      {filteredJadwal.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredJadwal.map((ev) => {
            const colors = KATEGORI_COLORS[ev.category] || KATEGORI_COLORS.lainnya;
            const dateObj = new Date(ev.date);
            const day = dateObj.getDate();
            const monthStr = dateObj.toLocaleString('id-ID', { month: 'short' });

            return (
              <div
                key={ev.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className={cn('h-1.5 w-full', colors.dot)} />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-[50px] rounded-xl border border-gray-100 bg-gray-50 p-2 text-center">
                      <span className="text-[10px] font-bold uppercase leading-none text-[#64748B]">{monthStr}</span>
                      <span className="mt-0.5 text-xl font-extrabold text-[#3B82F6]">{day}</span>
                    </div>

                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider', colors.bg, colors.text)}>
                      {ev.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#1E293B] transition-colors group-hover:text-[#3B82F6]">{ev.title}</h3>
                  <p className="mt-2 flex-1 line-clamp-2 text-sm leading-relaxed text-[#64748B]">{ev.description}</p>

                  <div className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{ev.startTime ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <CalendarDays className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-[#1E293B]">Tidak Ada Kegiatan</h3>
          <p className="mt-1 text-sm text-[#64748B]">Tidak ditemukan jadwal kegiatan yang cocok dengan filter atau pencarian Anda.</p>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Tambah Kegiatan RW</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Judul Kegiatan</label>
              <Input
                type="text"
                required
                value={newJudul}
                onChange={(e: any) => setNewJudul(e.target.value)}
                placeholder="Misal: Kerja Bakti Massal"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Kategori</label>
                <select
                  value={newKategori}
                  onChange={(e: any) => setNewKategori(e.target.value as EventCategory)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                >
                  {categories.filter((c) => c !== 'semua').map((cat) => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Tanggal</label>
                <Input
                  type="date"
                  required
                  value={newTanggal}
                  onChange={(e: any) => setNewTanggal(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Waktu (Jam)</label>
                <Input
                  type="text"
                  required
                  value={newWaktu}
                  onChange={(e: any) => setNewWaktu(e.target.value)}
                  placeholder="08:00 - 10:00 WIB"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Tempat / Lokasi</label>
                <Input
                  type="text"
                  required
                  value={newLokasi}
                  onChange={(e: any) => setNewLokasi(e.target.value)}
                  placeholder="Balai RW 25"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Deskripsi Singkat</label>
              <textarea
                rows={3}
                required
                value={newDeskripsi}
                onChange={(e: any) => setNewDeskripsi(e.target.value)}
                placeholder="Jelaskan secara singkat mengenai kegiatan ini..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>

            <Button
              type="submit"
              className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB]"
            >
              Simpan Kegiatan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
