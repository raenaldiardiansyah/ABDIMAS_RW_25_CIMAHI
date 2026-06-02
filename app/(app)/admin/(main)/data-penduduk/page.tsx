'use client';

import { UserPlus, Bell, Search, SlidersHorizontal } from 'lucide-react';

import { PENDUDUK_DATA, TOTAL_PENDUDUK } from '@/lib/dummydataadmin';

/* ── Page ────────────────────────────────────────────────── */

export default function DataPendudukPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* ── Header Actions ── */}
      <div className="flex items-stretch justify-between gap-4">
        {/* Tambah Warga */}
        <button
          onClick={() => console.log('Buka modal Tambah Warga')}
          className="flex flex-1 items-center gap-4 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] px-6 py-4 text-white transition hover:opacity-90 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold">Tambah Warga</p>
            <p className="text-sm text-white/70">Data Penduduk</p>
          </div>
        </button>

        {/* Permohonan */}
        <button
          onClick={() => console.log('Buka Permohonan')}
          className="relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-[#1E293B] transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
            <UserPlus className="h-6 w-6 text-[#3B82F6]" />
            {/* Red dot notification */}
            <span className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">Permohonan</p>
            <p className="text-sm text-[#64748B]">Penambahan warga</p>
          </div>
        </button>
      </div>

      {/* ── Action Bar ── */}
      <div className="flex items-center gap-3">
        {/* Badge count */}
        <div className="shrink-0 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] px-6 py-2.5">
          <span className="text-lg font-bold text-white">{TOTAL_PENDUDUK}</span>
          <span className="ml-2 text-sm text-white/80">Total Penduduk</span>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
          <input
            type="text"
            placeholder="Search"
            className="h-10 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#3B82F6]"
          />
        </div>

        {/* Filter button */}
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white transition hover:bg-[#2563EB]">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#3B82F6] text-white">
              <th className="px-5 py-3.5 text-left font-semibold">Nama Lengkap</th>
              <th className="px-5 py-3.5 text-left font-semibold">No.KK</th>
              <th className="px-5 py-3.5 text-left font-semibold">Alamat</th>
              <th className="px-5 py-3.5 text-left font-semibold">Status</th>
              <th className="px-5 py-3.5 text-left font-semibold" />
            </tr>
          </thead>
          <tbody>
            {PENDUDUK_DATA.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'}
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#1E293B]">{row.nama}</p>
                  <p className="text-xs text-[#3B82F6]">{row.nik}</p>
                </td>
                <td className="px-5 py-4 text-[#64748B]">{row.noKK}</td>
                <td className="px-5 py-4 text-[#64748B]">{row.alamat}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${row.status === 'Penduduk Tetap'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button className="rounded-full bg-[#3B82F6] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2563EB]">
                    Cek Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination Footer ── */}
        <div className="flex items-center justify-between bg-[#3B82F6] px-5 py-3 text-white">
          <span className="text-sm">
            Menampilkan 1 - 6 dari {TOTAL_PENDUDUK} Penduduk
          </span>
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
    </div>
  );
}
