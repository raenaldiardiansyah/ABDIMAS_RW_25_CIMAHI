'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect, useState } from 'react';
import { CalendarBlank as CalendarDays, MapPin, Clock, MagnifyingGlass as Search, Plus } from '@phosphor-icons/react';

import { ActivityTimeRangeField } from '@/components/admin/ActivityTimeRangeField';
import { cn } from '@/lib/utils';
import { platformFetch } from '@/lib/api/platform';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatActivityTimeRange, isValidTimeRange } from '@/lib/activity-time';
import { useActionToast } from '@/lib/use-action-toast';

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
  const { runWithToast } = useActionToast();
  const [jadwal, setJadwal] = useState<ActivityItem[]>([]);
  const [filterKategori, setFilterKategori] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJudul, setNewJudul] = useState('');
  const [newKategori, setNewKategori] = useState<EventCategory>('rapat');
  const [newTanggal, setNewTanggal] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newLokasi, setNewLokasi] = useState('');
  const [newDeskripsi, setNewDeskripsi] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);

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
    if (!newJudul || !newTanggal || !newStartTime || !newEndTime || !newLokasi || !newDeskripsi) return;
    if (!isValidTimeRange(newStartTime, newEndTime)) {
      setTimeError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }

    setTimeError(null);

    try {
      const response = await runWithToast(
        () =>
          platformFetch<ActivityItem>('/admin/activities', {
            method: 'POST',
            body: JSON.stringify({
              title: newJudul,
              description: newDeskripsi,
              location: newLokasi,
              category: newKategori,
              date: newTanggal,
              startTime: newStartTime,
              endTime: newEndTime,
            }),
          }),
        {
          loading: 'Menyimpan kegiatan...',
          success: 'Kegiatan berhasil dibuat',
          error: 'Gagal menyimpan kegiatan',
        },
      );

      setJadwal((prev) => [response.data, ...prev]);
      setIsModalOpen(false);
      setNewJudul('');
      setNewKategori('rapat');
      setNewTanggal('');
      setNewStartTime('');
      setNewEndTime('');
      setNewLokasi('');
      setNewDeskripsi('');
      setTimeError(null);
    } catch (error) {
      console.error(error);
    }
  };

  const categories = ['semua', 'rapat', 'kesehatan', 'sosial', 'keamanan', 'lainnya'] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(18px,2vw,24px)] font-bold text-[color:var(--admin-heading)]">Agenda Kegiatan RW</h2>
          <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">Kelola dan pantau seluruh jadwal kegiatan di lingkungan RW 25</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-[color:var(--admin-primary-strong)]"
        >
          <Plus className="h-4 w-4" />
          Tambah Kegiatan
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setFilterKategori(cat)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all',
                filterKategori === cat
                  ? 'border border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6] shadow-sm'
                  : 'bg-muted text-[color:var(--admin-subtle)] hover:bg-[color:var(--admin-surface-soft)]',
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-muted)]" />
          <Input
            type="text"
            placeholder="Cari kegiatan..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] py-2 pl-9 pr-4 text-sm transition focus-visible:ring-[color:var(--ring)]"
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
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className={cn('h-1.5 w-full', colors.dot)} />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-[50px] rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-2 text-center">
                      <span className="text-[10px] font-bold uppercase leading-none text-[color:var(--admin-subtle)]">{monthStr}</span>
                      <span className="mt-0.5 text-xl font-extrabold text-primary">{day}</span>
                    </div>

                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider', colors.bg, colors.text)}>
                      {ev.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[color:var(--admin-heading)] transition-colors group-hover:text-primary">{ev.title}</h3>
                  <p className="mt-2 flex-1 line-clamp-2 text-sm leading-relaxed text-[color:var(--admin-subtle)]">{ev.description}</p>

                    <div className="mt-5 flex flex-col gap-2 border-t border-[color:var(--admin-border)] pt-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--admin-subtle)]">
                      <Clock className="h-3.5 w-3.5 text-[color:var(--admin-muted)]" />
                      <span>{formatActivityTimeRange(ev.startTime, ev.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--admin-subtle)]">
                      <MapPin className="h-3.5 w-3.5 text-[color:var(--admin-muted)]" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--admin-surface-muted)]">
            <CalendarDays className="h-8 w-8 text-[color:var(--admin-muted)]" />
          </div>
          <h3 className="text-lg font-bold text-[color:var(--admin-heading)]">Tidak Ada Kegiatan</h3>
          <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">Tidak ditemukan jadwal kegiatan yang cocok dengan filter atau pencarian Anda.</p>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[color:var(--admin-heading)]">Tambah Kegiatan RW</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="mt-4 flex flex-col gap-4">
            <div>
              <Label className="mb-1 block text-sm font-semibold text-[color:var(--admin-heading)]">Judul Kegiatan</Label>
              <Input
                type="text"
                required
                value={newJudul}
                onChange={(e: any) => setNewJudul(e.target.value)}
                placeholder="Misal: Kerja Bakti Massal"
                className="w-full rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block text-sm font-semibold text-[color:var(--admin-heading)]">Kategori</Label>
                <Select value={newKategori} onValueChange={(value) => setNewKategori(value as EventCategory)}>
                  <SelectTrigger className="w-full rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-2.5 text-sm">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c !== 'semua').map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-sm font-semibold text-[color:var(--admin-heading)]">Tanggal</Label>
                <Input
                  type="date"
                  required
                  value={newTanggal}
                  onChange={(e: any) => setNewTanggal(e.target.value)}
                  className="w-full rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ActivityTimeRangeField
                startTime={newStartTime}
                endTime={newEndTime}
                onStartTimeChange={(value) => {
                  setNewStartTime(value);
                  setTimeError(null);
                }}
                onEndTimeChange={(value) => {
                  setNewEndTime(value);
                  setTimeError(null);
                }}
                error={timeError}
              />
              <div>
                <Label className="mb-1 block text-sm font-semibold text-[color:var(--admin-heading)]">Tempat / Lokasi</Label>
                <Input
                  type="text"
                  required
                  value={newLokasi}
                  onChange={(e: any) => setNewLokasi(e.target.value)}
                  placeholder="Balai RW 25"
                  className="w-full rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-sm font-semibold text-[color:var(--admin-heading)]">Deskripsi Singkat</Label>
              <Textarea
                rows={3}
                required
                value={newDeskripsi}
                onChange={(e: any) => setNewDeskripsi(e.target.value)}
                placeholder="Jelaskan secara singkat mengenai kegiatan ini..."
                className="w-full resize-none rounded-xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-2.5 text-sm"
              />
            </div>

            <Button
              type="submit"
              className="mt-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-[color:var(--admin-primary-strong)]"
            >
              Simpan Kegiatan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
