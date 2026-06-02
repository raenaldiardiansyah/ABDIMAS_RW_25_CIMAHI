'use client';

import { useState } from 'react';
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

import { MUTASI_DATA, MUTASI_STATS } from '@/lib/dummydataadmin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/* ── Page ────────────────────────────────────────────────── */

export default function MutasiPage() {
  const [viewedMutasi, setViewedMutasi] = useState<any>(null);

  // Helper to generate mock details based on the basic data
  const getMutasiDetail = (mutasi: any) => {
    if (!mutasi) return null;
    const isMasuk = mutasi.jenis === 'Masuk';
    return {
      alasan: isMasuk ? 'Pindah tempat kerja ke kota ini' : 'Pindah mengikuti domisili pasangan',
      asal: isMasuk ? 'Kota Bandung, Jawa Barat' : 'RW 25, Kel. Cibabat, Cimahi',
      tujuan: isMasuk ? 'RW 25, Kel. Cibabat, Cimahi' : 'Kab. Garut, Jawa Barat',
      keteranganStatus: 
        mutasi.status === 'Selesai' ? 'Berkas mutasi telah diverifikasi dan disetujui oleh admin.' :
        mutasi.status === 'Menunggu' ? 'Menunggu kelengkapan dokumen pengantar dari RT asal.' :
        'Berkas ditolak karena tidak menyertakan surat keterangan pindah asli.',
    };
  };

  const detail = getMutasiDetail(viewedMutasi);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header Actions ── */}
      <div className="flex flex-wrap items-stretch gap-4">
        {/* Tambah Mutasi */}
        <button
          onClick={() => console.log('Buka modal Tambah Mutasi')}
          className="flex min-w-[200px] flex-1 items-center gap-4 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] px-[clamp(16px,2vw,24px)] py-[clamp(12px,1.5vh,16px)] text-white transition hover:opacity-90 active:scale-[0.99]"
        >
          <div className="flex h-[clamp(36px,5vh,48px)] w-[clamp(36px,5vh,48px)] items-center justify-center rounded-full bg-white/20">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[clamp(14px,1.5vw,20px)] font-bold">Tambah Mutasi</p>
            <p className="text-[clamp(11px,1vw,14px)] text-white/70">Mutasi Penduduk</p>
          </div>
        </button>

        {/* Permohonan */}
        <Link
          href="/admin/permohonan"
          className="relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-[clamp(16px,2vw,24px)] py-[clamp(12px,1.5vh,16px)] text-[#1E293B] transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="relative flex h-[clamp(36px,5vh,48px)] w-[clamp(36px,5vh,48px)] items-center justify-center rounded-full bg-[#EFF6FF]">
            <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
            <span className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          </div>
          <div className="text-left">
            <p className="text-[clamp(14px,1.5vw,20px)] font-bold">Permohonan</p>
            <p className="text-[clamp(11px,1vw,14px)] text-[#64748B]">Permutasian</p>
          </div>
        </Link>
      </div>

      {/* ── Summary Horizontal Widgets ── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {/* Mutasi Masuk — Blue Gradient */}
        <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              <span className="text-xs text-white/80">Mutasi Masuk</span>
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
              {MUTASI_STATS.masukDelta}
            </span>
          </div>
          <p className="mt-3">
            <span className="text-3xl font-bold">{MUTASI_STATS.masuk}</span>
            <span className="ml-1 text-sm">Laporan</span>
          </p>
        </div>

        {/* Mutasi Keluar — Light */}
        <div className="rounded-2xl border border-gray-200 bg-[#EFF6FF] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-xs text-[#3B82F6]">Mutasi Keluar</span>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#3B82F6]">
              {MUTASI_STATS.keluarDelta}
            </span>
          </div>
          <p className="mt-3">
            <span className="text-3xl font-bold text-[#1E293B]">{MUTASI_STATS.keluar}</span>
            <span className="ml-1 text-sm text-[#64748B]">Laporan</span>
          </p>
        </div>

        {/* Total Mutasi — Blue Gradient */}
        <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-5 text-white">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs text-white/80">Total Mutasi</span>
          </div>
          <p className="mt-3">
            <span className="text-3xl font-bold">{MUTASI_STATS.total}</span>
            <span className="ml-1 text-sm">Laporan</span>
          </p>
          <button
            onClick={() => console.log('Ekspor Laporan')}
            className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#3B82F6] transition hover:bg-white/90"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor Laporan
          </button>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
          <input
            type="text"
            placeholder="Search"
            className="h-10 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#3B82F6]"
          />
        </div>
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white transition hover:bg-[#2563EB]">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ── Table ── */}
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
            {MUTASI_DATA.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'}
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#1E293B]">{row.tgl}</p>
                  <p className="text-xs text-[#64748B]">{row.jam}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#1E293B]">{row.nama}</p>
                  <p className="text-xs text-[#3B82F6]">{row.nik}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#3B82F6]">
                    {row.jenis === 'Masuk' ? (
                      <><ArrowRight className="h-3 w-3" /> Masuk</>
                    ) : (
                      <><ArrowLeft className="h-3 w-3" /> Keluar</>
                    )}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold text-[#1E293B]">
                  {row.ket}
                </td>
                <td className="px-5 py-4">
                  <span
                    className="flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: row.statusColor }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: row.statusColor }}
                    />
                    {row.status}
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
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-[#3B82F6] px-5 py-3 text-white">
          <span className="text-sm">Menampilkan 1 - 4 dari 15 Laporan</span>
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

      {/* ── Dialog Detail Mutasi ── */}
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
              {/* Profil Singkat */}
              <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4 border border-gray-100">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${viewedMutasi.jenis === 'Masuk' ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'bg-red-50 text-red-500'}`}>
                  {viewedMutasi.jenis === 'Masuk' ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B]">{viewedMutasi.nama}</h3>
                  <p className="text-xs font-semibold text-[#64748B]">NIK: {viewedMutasi.nik}</p>
                </div>
              </div>

              {/* Rincian Mutasi */}
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

              {/* Alasan */}
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Alasan Mutasi</p>
                <p className="mt-1 text-[#1E293B]">{detail.alasan}</p>
                <p className="mt-2 text-xs text-[#64748B]">Keterangan: {viewedMutasi.ket}</p>
              </div>

              {/* Status Validasi */}
              <div className="rounded-xl border border-gray-100 p-4" style={{ backgroundColor: viewedMutasi.status === 'Selesai' ? '#F0FDF4' : viewedMutasi.status === 'Ditolak' ? '#FEF2F2' : '#F8FAFC' }}>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: viewedMutasi.statusColor }} />
                  <p className="text-sm font-bold uppercase tracking-wide" style={{ color: viewedMutasi.statusColor }}>Status: {viewedMutasi.status}</p>
                </div>
                <p className="mt-2 text-sm text-[#1E293B] font-medium">{detail.keteranganStatus}</p>
              </div>

              <div className="text-right text-xs font-semibold text-gray-400">
                Diajukan pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
