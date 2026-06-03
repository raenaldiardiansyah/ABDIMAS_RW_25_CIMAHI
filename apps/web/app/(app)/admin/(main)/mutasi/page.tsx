'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  Eye,
  ArrowRight,
  ArrowLeft,
  Download,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformFetch } from '@/lib/api/platform';

type MutationRow = {
  id: string;
  citizenId: string;
  type: 'IN' | 'OUT' | 'MOVE' | 'DEATH' | 'BIRTH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fromAddress: string | null;
  toAddress: string | null;
  reason: string | null;
  createdAt: string;
};

type CitizenRow = {
  id: string;
  nik: string;
  name: string;
};

function getStatusColor(status: MutationRow['status']) {
  if (status === 'APPROVED') return '#16A34A';
  if (status === 'REJECTED') return '#DC2626';
  return '#F59E0B';
}

function getStatusLabel(status: MutationRow['status']) {
  if (status === 'APPROVED') return 'Selesai';
  if (status === 'REJECTED') return 'Ditolak';
  return 'Menunggu';
}

export default function MutasiPage() {
  const [rows, setRows] = useState<MutationRow[]>([]);
  const [citizens, setCitizens] = useState<Record<string, CitizenRow>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<string>('ALL');
  const [viewedMutasi, setViewedMutasi] = useState<MutationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [mutationResponse, citizenResponse] = await Promise.all([
          platformFetch<MutationRow[]>('/admin/mutations?page=1&limit=100'),
          platformFetch<CitizenRow[]>('/admin/citizens?page=1&limit=200'),
        ]);

        if (!active) return;
        setRows(mutationResponse.data);
        setCitizens(
          Object.fromEntries(citizenResponse.data.map((citizen) => [citizen.id, citizen])),
        );
      } catch (error) {
        console.error(error);
        if (!active) return;
        setRows([]);
        setCitizens({});
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    platformFetch<any[]>('/admin/requests?page=1&limit=1&status=PENDING')
      .then((res: any) => {
        if (active && res.data) {
          setHasPendingRequests(res.data.length > 0);
        }
      })
      .catch(() => {
        // silently ignore error
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredRows = rows.filter((row) => {
    const citizen = citizens[row.citizenId];
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      citizen?.name.toLowerCase().includes(search) ||
      citizen?.nik.includes(searchQuery) ||
      row.reason?.toLowerCase().includes(search) ||
      row.toAddress?.toLowerCase().includes(search) ||
      row.fromAddress?.toLowerCase().includes(search);
    const matchesType = activeType === 'ALL' || row.type === activeType;
    return matchesSearch && matchesType;
  });

  const stats = {
    masuk: rows.filter((row) => row.type === 'IN').length,
    keluar: rows.filter((row) => row.type === 'OUT').length,
    total: rows.length,
  };

  const detail = viewedMutasi
    ? {
        alasan: viewedMutasi.reason ?? '-',
        asal: viewedMutasi.fromAddress ?? '-',
        tujuan: viewedMutasi.toAddress ?? '-',
        keteranganStatus:
          viewedMutasi.status === 'APPROVED'
            ? 'Berkas mutasi telah diverifikasi dan disetujui oleh admin.'
            : viewedMutasi.status === 'PENDING'
              ? 'Menunggu verifikasi admin.'
              : 'Berkas mutasi ditolak oleh admin.',
      }
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-stretch gap-4">
        <Link
          href="/admin/mutasi/tambah"
          className="relative overflow-hidden flex min-w-[200px] flex-1 items-center gap-4 rounded-2xl bg-[#2563EB] px-[clamp(16px,2vw,24px)] py-[clamp(12px,1.5vh,16px)] text-white transition hover:bg-[#1D4ED8] active:scale-[0.99]"
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/[0.08]" />
          <div className="pointer-events-none absolute right-12 top-2 h-24 w-24 rounded-full bg-white/[0.12]" />
          <div className="flex h-[clamp(36px,5vh,48px)] w-[clamp(36px,5vh,48px)] items-center justify-center rounded-full bg-white/20">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[clamp(14px,1.5vw,20px)] font-bold">Tambah Mutasi</p>
            <p className="text-[clamp(11px,1vw,14px)] text-white/80">Mutasi Penduduk</p>
          </div>
        </Link>

        <Link
          href="/admin/permohonan"
          className="relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-[clamp(16px,2vw,24px)] py-[clamp(12px,1.5vh,16px)] text-[#1E293B] transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="relative flex h-[clamp(36px,5vh,48px)] w-[clamp(36px,5vh,48px)] items-center justify-center rounded-full bg-[#EFF6FF]">
            <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
            {hasPendingRequests && (
              <span className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
            )}
          </div>
          <div className="text-left">
            <p className="text-[clamp(14px,1.5vw,20px)] font-bold">Permohonan</p>
            <p className="text-[clamp(11px,1vw,14px)] text-[#64748B]">Permutasian</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#2563EB] p-4 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.08]" />
          <div className="pointer-events-none absolute right-12 top-2 h-16 w-16 rounded-full bg-white/[0.12]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              <span className="text-xs text-white/80">Mutasi Masuk</span>
            </div>
          </div>
          <p className="relative z-10 mt-2">
            <span className="text-3xl font-bold">{stats.masuk}</span>
            <span className="ml-1 text-sm">Laporan</span>
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-[#EFF6FF] p-4 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#3B82F6]/[0.05]" />
          <div className="pointer-events-none absolute right-12 top-2 h-16 w-16 rounded-full bg-[#3B82F6]/[0.08]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-xs font-semibold text-[#3B82F6]">Mutasi Keluar</span>
            </div>
          </div>
          <p className="relative z-10 mt-2">
            <span className="text-3xl font-bold text-[#1E293B]">{stats.keluar}</span>
            <span className="ml-1 text-sm font-medium text-[#64748B]">Laporan</span>
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#2563EB] p-4 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.08]" />
          <div className="pointer-events-none absolute right-12 top-2 h-16 w-16 rounded-full bg-white/[0.12]" />
          <div className="relative z-10 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs text-white/80">Total Mutasi</span>
          </div>
          <div className="relative z-10 mt-2 flex items-center justify-between">
            <p>
              <span className="text-3xl font-bold">{stats.total}</span>
              <span className="ml-1 text-sm">Laporan</span>
            </p>
            <Button
              onClick={() => window.open('/api/platform/admin/mutations/export', '_blank')}
              className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#3B82F6] shadow-sm transition hover:bg-white/90"
            >
              <Download className="h-3.5 w-3.5" />
              Ekspor
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
          <Input
            type="text"
            placeholder="Cari warga, NIK, asal, atau alasan mutasi..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#3B82F6]"
          />
        </div>
        <div className="w-[180px] shrink-0">
          <Select value={activeType} onValueChange={(val: any) => setActiveType(val)}>
            <SelectTrigger className="h-10 rounded-full border border-gray-200 bg-white font-medium text-gray-700 shadow-sm focus:ring-[#3B82F6]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#3B82F6]" />
                <SelectValue placeholder="Semua Mutasi" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Mutasi</SelectItem>
              <SelectItem value="IN">Mutasi Masuk</SelectItem>
              <SelectItem value="OUT">Mutasi Keluar</SelectItem>
              <SelectItem value="MOVE">Pindah Alamat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#3B82F6] text-white">
              <th className="px-5 py-3.5 text-left font-semibold">TGL Pengajuan</th>
              <th className="px-5 py-3.5 text-left font-semibold">Nama Warga/KK</th>
              <th className="px-5 py-3.5 text-left font-semibold">Jenis Mutasi</th>
              <th className="px-5 py-3.5 text-left font-semibold">Keterangan</th>
              <th className="px-5 py-3.5 text-left font-semibold">Status Validasi</th>
              <th className="px-5 py-3.5 text-left font-semibold" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, i) => {
                const citizen = citizens[row.citizenId];
                const statusColor = getStatusColor(row.status);

                return (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1E293B]">
                        {new Date(row.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(row.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1E293B]">{citizen?.name ?? row.citizenId}</p>
                      <p className="text-xs text-[#3B82F6]">{citizen?.nik ?? '-'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#3B82F6]">
                        {row.type === 'IN' ? (
                          <>
                            <ArrowRight className="h-3 w-3" /> Masuk
                          </>
                        ) : (
                          <>
                            <ArrowLeft className="h-3 w-3" /> Keluar
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#1E293B]">{row.reason ?? '-'}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: statusColor }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                        {getStatusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setViewedMutasi(row)}
                        className="transition hover:opacity-70"
                        title="Lihat Detail Mutasi"
                      >
                        <Eye className="h-5 w-5 text-[#3B82F6]" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#64748B]">
                  {loading ? 'Memuat data mutasi...' : 'Tidak ada data mutasi.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between bg-[#3B82F6] px-5 py-3 text-white">
          <span className="text-sm">Menampilkan {filteredRows.length} dari {rows.length} laporan</span>
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm transition hover:bg-white/30">
              &lt;
            </button>
            <span className="text-sm font-medium">Halaman 1</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm transition hover:bg-white/30">
              &gt;
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!viewedMutasi} onOpenChange={(open) => !open && setViewedMutasi(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Detail Mutasi Penduduk</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Informasi lengkap perpindahan domisili warga.
            </DialogDescription>
          </DialogHeader>

          {viewedMutasi && detail && (
            <div className="mt-4 flex flex-col gap-5">
              <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    viewedMutasi.type === 'IN' ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'bg-red-50 text-red-500'
                  }`}
                >
                  {viewedMutasi.type === 'IN' ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B]">
                    {citizens[viewedMutasi.citizenId]?.name ?? viewedMutasi.citizenId}
                  </h3>
                  <p className="text-xs font-semibold text-[#64748B]">
                    NIK: {citizens[viewedMutasi.citizenId]?.nik ?? '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Asal (Dari)</p>
                  <p className="mt-1 font-semibold text-[#1E293B]">{detail.asal}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Tujuan (Ke)</p>
                  <p className="mt-1 font-semibold text-[#1E293B]">{detail.tujuan}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Alasan Mutasi</p>
                <p className="mt-1 text-[#1E293B]">{detail.alasan}</p>
              </div>

              <div
                className="rounded-xl border border-gray-100 p-4"
                style={{
                  backgroundColor:
                    viewedMutasi.status === 'APPROVED'
                      ? '#F0FDF4'
                      : viewedMutasi.status === 'REJECTED'
                        ? '#FEF2F2'
                        : '#F8FAFC',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(viewedMutasi.status) }}
                  />
                  <p
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: getStatusColor(viewedMutasi.status) }}
                  >
                    Status: {getStatusLabel(viewedMutasi.status)}
                  </p>
                </div>
                <p className="mt-2 text-sm font-medium text-[#1E293B]">{detail.keteranganStatus}</p>
              </div>

              <div className="text-right text-xs font-semibold text-gray-400">
                Diajukan pada:{' '}
                {new Date(viewedMutasi.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                pukul{' '}
                {new Date(viewedMutasi.createdAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
