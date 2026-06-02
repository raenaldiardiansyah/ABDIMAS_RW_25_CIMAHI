'use client';

import { useState } from 'react';
import { CalendarDays, MapPin, Clock, Search, Plus } from 'lucide-react';
import { MOCK_JADWAL, KATEGORI_COLORS } from '@/constants/mockData';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function KegiatanPage() {
  const [jadwal, setJadwal] = useState(MOCK_JADWAL);
  const [filterKategori, setFilterKategori] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJudul, setNewJudul] = useState('');
  const [newKategori, setNewKategori] = useState('rapat');
  const [newTanggal, setNewTanggal] = useState('');
  const [newWaktu, setNewWaktu] = useState('');
  const [newLokasi, setNewLokasi] = useState('');
  const [newDeskripsi, setNewDeskripsi] = useState('');

  const filteredJadwal = jadwal.filter((event) => {
    const matchCat = filterKategori === 'semua' || event.kategori === filterKategori;
    const matchSearch = event.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        event.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul || !newTanggal || !newWaktu || !newLokasi) {
      alert("Harap lengkapi semua field wajib!");
      return;
    }

    const newEvent = {
      id: `j${Date.now()}`,
      tanggal: newTanggal,
      judul: newJudul,
      waktu: newWaktu,
      lokasi: newLokasi,
      kategori: newKategori,
      deskripsi: newDeskripsi,
    };

    // Add to the front of the list
    setJadwal([newEvent, ...jadwal]);
    setIsModalOpen(false);

    // Reset form
    setNewJudul('');
    setNewKategori('rapat');
    setNewTanggal('');
    setNewWaktu('');
    setNewLokasi('');
    setNewDeskripsi('');
  };

  const categories = ['semua', 'rapat', 'kesehatan', 'sosial', 'keamanan', 'lainnya'];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(18px,2vw,24px)] font-bold text-[#1E293B]">Agenda Kegiatan RW</h2>
          <p className="text-sm text-[#64748B] mt-1">Kelola dan pantau seluruh jadwal kegiatan di lingkungan RW 025</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          Tambah Kegiatan
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterKategori(cat)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                filterKategori === cat
                  ? "bg-[#3B82F6] text-white shadow-md"
                  : "bg-gray-100 text-[#64748B] hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[#3B82F6] focus:bg-white"
          />
        </div>
      </div>

      {/* Event Grid */}
      {filteredJadwal.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJadwal.map((ev) => {
            const colors = KATEGORI_COLORS[ev.kategori] || KATEGORI_COLORS.lainnya;
            // Parse date for nice formatting
            const dateObj = new Date(ev.tanggal);
            const day = dateObj.getDate();
            const monthStr = dateObj.toLocaleString('id-ID', { month: 'short' });

            return (
              <div key={ev.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Top Banner indicating Category */}
                <div className={cn("h-1.5 w-full", colors.dot)} />
                
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col rounded-xl bg-gray-50 p-2 text-center min-w-[50px] border border-gray-100">
                      <span className="text-[10px] font-bold uppercase text-[#64748B] leading-none">{monthStr}</span>
                      <span className="text-xl font-extrabold text-[#3B82F6] mt-0.5">{day}</span>
                    </div>
                    
                    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", colors.bg, colors.text)}>
                      {ev.kategori}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#1E293B] group-hover:text-[#3B82F6] transition-colors">{ev.judul}</h3>
                  <p className="mt-2 text-sm text-[#64748B] flex-1 line-clamp-2 leading-relaxed">{ev.deskripsi}</p>
                  
                  <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{ev.waktu}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{ev.lokasi}</span>
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

      {/* Modal Tambah Kegiatan */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Tambah Kegiatan RW</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Judul Kegiatan</label>
              <input 
                type="text" 
                required
                value={newJudul}
                onChange={(e) => setNewJudul(e.target.value)}
                placeholder="Misal: Kerja Bakti Massal"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Kategori</label>
                <select 
                  value={newKategori}
                  onChange={(e) => setNewKategori(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                >
                  {categories.filter(c => c !== 'semua').map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Tanggal</label>
                <input 
                  type="date" 
                  required
                  value={newTanggal}
                  onChange={(e) => setNewTanggal(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Waktu (Jam)</label>
                <input 
                  type="text" 
                  required
                  value={newWaktu}
                  onChange={(e) => setNewWaktu(e.target.value)}
                  placeholder="08:00 - 10:00 WIB"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1E293B]">Tempat / Lokasi</label>
                <input 
                  type="text" 
                  required
                  value={newLokasi}
                  onChange={(e) => setNewLokasi(e.target.value)}
                  placeholder="Balai RW 025"
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
                onChange={(e) => setNewDeskripsi(e.target.value)}
                placeholder="Jelaskan secara singkat mengenai kegiatan ini..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#3B82F6] focus:bg-white"
              />
            </div>

            <button 
              type="submit"
              className="mt-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB]"
            >
              Simpan Kegiatan
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
