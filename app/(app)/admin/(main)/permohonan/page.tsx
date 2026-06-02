'use client';

import { FileText, CheckCircle2, XCircle, UserPlus, FileInput, Eye, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/* ── Mock Data ──────────────────────────────────────────── */

const INITIAL_PERMOHONAN = [
  { 
    id: 1, 
    nama: 'Ahmad Rizal', 
    nik: '3275010908070012', 
    alamat: 'Jl. Pahlawan No. 45, RT.02/RW.25', 
    tanggal: '12 Mei 2026', 
    status: 'Menunggu',
    jenis: 'Pendaftaran Kartu Keluarga Baru',
    anggotaList: [
      { nama: 'Ahmad Rizal', hubungan: 'Kepala Keluarga', nik: '3275010908070012' },
      { nama: 'Siti Aisyah', hubungan: 'Istri', nik: '3275010908070013' },
      { nama: 'Budi Rizal', hubungan: 'Anak', nik: '3275010908070014' },
    ]
  },
  { 
    id: 2, 
    nama: 'Siti Nurbaya', 
    nik: '3275010908070088', 
    alamat: 'Jl. Kenangan No. 12, RT.04/RW.25', 
    tanggal: '14 Mei 2026', 
    status: 'Menunggu',
    jenis: 'Pendaftaran Kartu Keluarga Baru',
    anggotaList: [
      { nama: 'Siti Nurbaya', hubungan: 'Kepala Keluarga', nik: '3275010908070088' },
      { nama: 'Andi Saputra', hubungan: 'Anak', nik: '3275010908070089' },
    ]
  },
];

const INITIAL_PERMOHONAN_MUTASI = [
  {
    id: 101,
    nama: 'Joko Susanto',
    nik: '3275010908070055',
    alamat: 'Jl. Merdeka No. 10, RT.01/RW.25',
    tanggal: '15 Mei 2026',
    status: 'Menunggu',
    jenis: 'Mutasi Keluar',
    alasan: 'Pindah tugas kerja ke Jakarta'
  },
  {
    id: 102,
    nama: 'Rina Melati',
    nik: '3275010908070066',
    alamat: 'Jl. Pahlawan No. 2, RT.03/RW.25',
    tanggal: '16 Mei 2026',
    status: 'Menunggu',
    jenis: 'Mutasi Masuk',
    alasan: 'Mengikuti domisili suami'
  }
];

/* ── Page ────────────────────────────────────────────────── */

export default function PermohonanPage() {
  const [permohonan, setPermohonan] = useState(INITIAL_PERMOHONAN);
  const [permohonanMutasi, setPermohonanMutasi] = useState(INITIAL_PERMOHONAN_MUTASI);
  const [viewedAnggota, setViewedAnggota] = useState<any>(null);
  const [viewedMutasi, setViewedMutasi] = useState<any>(null);

  const handleSetujuiKK = (id: number) => {
    setPermohonan(prev => prev.filter(p => p.id !== id));
  };

  const handleTolakKK = (id: number) => {
    setPermohonan(prev => prev.filter(p => p.id !== id));
  };

  const handleSetujuiMutasi = (id: number) => {
    setPermohonanMutasi(prev => prev.filter(p => p.id !== id));
  };

  const handleTolakMutasi = (id: number) => {
    setPermohonanMutasi(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Daftar Permohonan Warga</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Tinjau dan verifikasi permohonan pendaftaran Kartu Keluarga baru.
          </p>
        </div>
      </div>

      {/* ── Section: Permohonan Kartu Keluarga ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#1E293B] border-b border-gray-100 pb-2">Permohonan Kartu Keluarga Baru</h2>
        {permohonan.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <CheckCircle2 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-[#1E293B]">Tidak ada permohonan baru</h3>
            <p className="text-xs text-[#64748B]">Semua permohonan KK telah diverifikasi.</p>
          </div>
        ) : (
          permohonan.map((item) => (
            <div key={item.id} className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between">
              
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                  <FileInput className="h-6 w-6 text-[#3B82F6]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-[#1E293B]">{item.nama}</h2>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#3B82F6]">{item.jenis}</p>
                  
                  <div className="mt-3 flex flex-col gap-1 text-sm text-[#64748B] sm:flex-row sm:items-center sm:gap-4">
                    <p>NIK: <span className="font-semibold text-[#1E293B]">{item.nik}</span></p>
                    <span className="hidden sm:inline">•</span>
                    <p>Tanggal: <span className="font-semibold text-[#1E293B]">{item.tanggal}</span></p>
                  </div>
                  <p className="mt-2 text-sm text-[#64748B]">{item.alamat}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 pt-4 md:border-none md:pt-0 w-full md:w-auto">
                <button
                  onClick={() => setViewedAnggota(item)}
                  className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                  title="Lihat Daftar Keluarga"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleTolakKK(item.id)}
                  className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="hidden md:inline">Tolak</span>
                </button>
                <button
                  onClick={() => handleSetujuiKK(item.id)}
                  className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden md:inline">Setujui</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ── Section: Permohonan Mutasi Penduduk ── */}
      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-lg font-bold text-[#1E293B] border-b border-gray-100 pb-2">Permohonan Mutasi Penduduk</h2>
        {permohonanMutasi.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <CheckCircle2 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-[#1E293B]">Tidak ada permohonan baru</h3>
            <p className="text-xs text-[#64748B]">Semua permohonan Mutasi telah diverifikasi.</p>
          </div>
        ) : (
          permohonanMutasi.map((item) => (
            <div key={item.id} className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between">
              
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                  <RefreshCw className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-[#1E293B]">{item.nama}</h2>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-indigo-500">{item.jenis}</p>
                  
                  <div className="mt-3 flex flex-col gap-1 text-sm text-[#64748B] sm:flex-row sm:items-center sm:gap-4">
                    <p>NIK: <span className="font-semibold text-[#1E293B]">{item.nik}</span></p>
                    <span className="hidden sm:inline">•</span>
                    <p>Tanggal: <span className="font-semibold text-[#1E293B]">{item.tanggal}</span></p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#1E293B]">Alasan: {item.alasan}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{item.alamat}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 pt-4 md:border-none md:pt-0 w-full md:w-auto">
                <button
                  onClick={() => setViewedMutasi(item)}
                  className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                  title="Lihat Keterangan"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleTolakMutasi(item.id)}
                  className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="hidden md:inline">Tolak</span>
                </button>
                <button
                  onClick={() => handleSetujuiMutasi(item.id)}
                  className="flex flex-1 md:flex-none items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden md:inline">Setujui</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ── Dialog Lihat Daftar Keluarga ── */}
      <Dialog open={!!viewedAnggota} onOpenChange={(open) => !open && setViewedAnggota(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Detail Keluarga: {viewedAnggota?.nama}</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Daftar anggota keluarga yang diajukan dalam permohonan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            {viewedAnggota?.anggotaList.map((anggota: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="font-bold text-[#1E293B]">{anggota.nama}</p>
                  <p className="text-xs font-semibold text-[#3B82F6]">{anggota.nik}</p>
                </div>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                  {anggota.hubungan}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Lihat Detail Mutasi ── */}
      <Dialog open={!!viewedMutasi} onOpenChange={(open) => !open && setViewedMutasi(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Detail Permohonan Mutasi</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Informasi lengkap terkait pengajuan mutasi penduduk.
            </DialogDescription>
          </DialogHeader>
          {viewedMutasi && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                <p className="font-bold text-[#1E293B]">{viewedMutasi.nama}</p>
                <p className="text-sm font-semibold text-indigo-500 mt-1">{viewedMutasi.jenis}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Alamat saat ini / tujuan</p>
                <p className="mt-1 text-sm text-[#1E293B]">{viewedMutasi.alamat}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Alasan</p>
                <p className="mt-1 text-sm font-medium text-[#1E293B]">{viewedMutasi.alasan}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
