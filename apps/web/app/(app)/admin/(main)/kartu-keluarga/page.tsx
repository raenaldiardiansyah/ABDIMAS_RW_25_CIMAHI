'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Search, SlidersHorizontal, Eye } from 'lucide-react';

import { platformFetch } from '@/lib/api/platform';

type HouseholdRow = {
  id: string;
  kkNumber: string;
  address: string;
  rt: string;
  rw: string;
  status: string;
  memberCount?: number;
  headCitizen?: {
    id: string;
    name: string;
    nik: string;
  };
};

export default function KartuKeluargaPage() {
  const [rows, setRows] = useState<HouseholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempRt, setTempRt] = useState('');
  const [activeRt, setActiveRt] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const query = new URLSearchParams({ page: '1', limit: '100' });
        if (activeRt) query.set('rt', activeRt);
        const response = await platformFetch<HouseholdRow[]>(`/admin/households?${query.toString()}`);
        if (!active) return;
        setRows(response.data);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    setLoading(true);
    void load();

    return () => {
      active = false;
    };
  }, [activeRt]);

  const filteredKK = rows.filter((item) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      item.headCitizen?.name.toLowerCase().includes(search) ||
      item.headCitizen?.nik.includes(searchQuery) ||
      item.kkNumber.includes(searchQuery) ||
      item.address.toLowerCase().includes(search);
    const matchesRt = activeRt === '' || item.rt === activeRt;
    return matchesSearch && matchesRt;
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-stretch justify-between gap-4">
        <button
          onClick={() => console.log('Buka modal Tambah Kepala Keluarga')}
          className="flex flex-1 items-center gap-4 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] px-6 py-4 text-white transition hover:opacity-90 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold">Tambah Kepala Keluarga</p>
            <p className="text-sm text-white/70">Kartu Keluarga</p>
          </div>
        </button>

        <Link
          href="/admin/permohonan"
          className="relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-[#1E293B] transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
            <ClipboardList className="h-6 w-6 text-[#3B82F6]" />
            <span className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">Permohonan</p>
            <p className="text-sm text-[#64748B]">Penambahan KK</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
          <input
            type="text"
            placeholder="Cari Kepala Keluarga, NIK, atau No. KK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#3B82F6]"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setFilterOpen(!filterOpen);
              setTempRt(activeRt);
            }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${activeRt ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#3B82F6] hover:bg-[#2563EB]'} text-white`}
            title="Filter Data"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
              <h3 className="text-base font-bold text-[#1E293B]">Filter Data</h3>
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                    Filter Berdasarkan RT
                  </label>
                  <select
                    value={tempRt}
                    onChange={(e) => setTempRt(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#3B82F6] focus:bg-white"
                  >
                    <option value="">Semua RT</option>
                    <option value="01">RT 01</option>
                    <option value="02">RT 02</option>
                    <option value="03">RT 03</option>
                    <option value="04">RT 04</option>
                    <option value="05">RT 05</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setActiveRt(tempRt);
                    setFilterOpen(false);
                  }}
                  className="rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2563EB]"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#3B82F6] text-white">
              <th className="px-5 py-3.5 text-left font-semibold">Kepala Keluarga</th>
              <th className="px-5 py-3.5 text-left font-semibold">No.KK</th>
              <th className="px-5 py-3.5 text-left font-semibold">Alamat</th>
              <th className="px-5 py-3.5 text-left font-semibold">RT/RW</th>
              <th className="px-5 py-3.5 text-left font-semibold">Anggota Keluarga</th>
              <th className="px-5 py-3.5 text-left font-semibold" />
            </tr>
          </thead>
          <tbody>
            {filteredKK.length > 0 ? (
              filteredKK.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1E293B]">{row.headCitizen?.name ?? '-'}</p>
                    <p className="text-xs text-[#3B82F6]">{row.headCitizen?.nik ?? '-'}</p>
                  </td>
                  <td className="px-5 py-4 text-[#64748B]">{row.kkNumber}</td>
                  <td className="px-5 py-4 text-[#64748B]">{row.address}</td>
                  <td className="px-5 py-4 font-bold text-[#1E293B]">
                    RT {row.rt}/RW {row.rw}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[#64748B]">
                      {row.memberCount ?? 0} Orang
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/kartu-keluarga/${row.id}`} className="transition hover:opacity-70">
                      <Eye className="h-5 w-5 text-[#3B82F6]" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#64748B]">
                  {loading ? 'Memuat data kartu keluarga...' : 'Tidak ada data yang cocok dengan pencarian atau filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between bg-[#3B82F6] px-5 py-3 text-white">
          <span className="text-sm">
            Menampilkan {filteredKK.length} dari {rows.length} kartu keluarga
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
