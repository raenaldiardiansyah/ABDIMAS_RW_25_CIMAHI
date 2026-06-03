'use client';

import { useEffect, useState } from 'react';
import { Download, Users, FileText, RefreshCw, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformFetch } from '@/lib/api/platform';

type SummaryData = {
  stats: {
    totalWarga: number;
    totalKK: number;
    totalMutasi: number;
    pendingRequests: number;
  };
};

type RtRow = {
  rt: string;
  rw: string;
  kk: number;
  warga: number;
  mutasi: number;
  produktif: number;
};

type CitizenRow = {
  id: string;
  nik: string;
  name: string;
  address: string;
  status: string;
  gender: string;
  birthDate: string;
  rt: string;
  rw: string;
};

function getAgeGroup(birthDate: string) {
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  if (age <= 17) return '0-17';
  if (age <= 35) return '18-35';
  if (age <= 60) return '36-60';
  return '60+';
}

export default function LaporanPage() {
  const [tahun, setTahun] = useState('2026');
  const [bulan, setBulan] = useState('');
  const [rt, setRt] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [stats, setStats] = useState<SummaryData['stats']>({
    totalWarga: 0,
    totalKK: 0,
    totalMutasi: 0,
    pendingRequests: 0,
  });
  const [rtData, setRtData] = useState<RtRow[]>([]);
  const [allCitizens, setAllCitizens] = useState<CitizenRow[]>([]);
  const [viewedRT, setViewedRT] = useState<RtRow | null>(null);
  const [rtCitizens, setRtCitizens] = useState<CitizenRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [summaryResponse, rtResponse, citizenResponse] = await Promise.all([
          platformFetch<SummaryData>('/admin/reports/summary'),
          platformFetch<RtRow[]>('/admin/reports/rt-breakdown'),
          platformFetch<CitizenRow[]>('/admin/citizens?page=1&limit=500'),
        ]);

        if (!active) return;
        setStats(summaryResponse.data.stats);
        setRtData(rtResponse.data);
        setAllCitizens(citizenResponse.data);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setStats({ totalWarga: 0, totalKK: 0, totalMutasi: 0, pendingRequests: 0 });
        setRtData([]);
        setAllCitizens([]);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredCitizens = allCitizens.filter((citizen) => (rt ? citizen.rt === rt.replace('RT ', '') : true));
  const ageGroups = [
    { label: '0-17', value: filteredCitizens.filter((c) => getAgeGroup(c.birthDate) === '0-17').length },
    { label: '18-35', value: filteredCitizens.filter((c) => getAgeGroup(c.birthDate) === '18-35').length },
    { label: '36-60', value: filteredCitizens.filter((c) => getAgeGroup(c.birthDate) === '36-60').length },
    { label: '60+', value: filteredCitizens.filter((c) => getAgeGroup(c.birthDate) === '60+').length },
  ];
  const maxAgeValue = Math.max(...ageGroups.map((g) => g.value), 1);
  const lakiLaki = filteredCitizens.filter((c) => c.gender === 'MALE').length;
  const perempuan = filteredCitizens.filter((c) => c.gender === 'FEMALE').length;
  const genderTotal = lakiLaki + perempuan || 1;

  const handleOpenDetail = async (row: RtRow) => {
    setViewedRT(row);
    setSearchQuery('');
    setCurrentPage(1);

    try {
      const response = await platformFetch<CitizenRow[]>(`/admin/reports/rt/${row.rt}/citizens`);
      setRtCitizens(response.data);
    } catch (error) {
      console.error(error);
      setRtCitizens([]);
    }
  };

  const handleApplyFilter = () => {
    if (!bulan || !rt) return;
    setActiveFilter(`${bulan} ${tahun} - ${rt}`);
  };

  const ITEMS_PER_PAGE = 10;
  const filteredPenduduk = rtCitizens.filter(
    (citizen) =>
      citizen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      citizen.nik.includes(searchQuery),
  );
  const totalPages = Math.ceil(filteredPenduduk.length / ITEMS_PER_PAGE);
  const paginatedPenduduk = filteredPenduduk.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const visibleRtData = rt ? rtData.filter((row) => row.rt === rt.replace('RT ', '')) : rtData;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[clamp(14px,1.5vw,18px)] font-bold text-[#1E293B]">Laporan Data Warga Siap Cetak</h2>
          {activeFilter ? <p className="mt-1 text-sm font-medium text-[#3B82F6]">Filter Aktif: {activeFilter}</p> : null}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open('/api/platform/admin/reports/export/pdf', '_blank')}
            className="flex items-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
          >
            <Download className="h-4 w-4" />
            Unduh PDF
          </button>
          <button
            onClick={() => window.open('/api/platform/admin/reports/export/xlsx', '_blank')}
            className="flex items-center gap-2 rounded-xl bg-[#EFF6FF] px-4 py-2.5 text-sm font-semibold text-[#3B82F6] transition hover:bg-[#E0E7FF]"
          >
            <Download className="h-4 w-4" />
            Unduh Excel
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={tahun}
          onChange={(e) => setTahun(e.target.value)}
          className="h-10 rounded-xl border-0 bg-[#3B82F6] px-4 text-sm font-medium text-white outline-none"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
        <select
          value={bulan}
          onChange={(e) => setBulan(e.target.value)}
          className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#64748B] outline-none"
        >
          <option value="">Pilih Bulan</option>
          <option value="Januari">Januari</option>
          <option value="Februari">Februari</option>
          <option value="Maret">Maret</option>
          <option value="April">April</option>
          <option value="Mei">Mei</option>
          <option value="Juni">Juni</option>
          <option value="Juli">Juli</option>
          <option value="Agustus">Agustus</option>
          <option value="September">September</option>
          <option value="Oktober">Oktober</option>
          <option value="November">November</option>
          <option value="Desember">Desember</option>
        </select>
        <select
          value={rt}
          onChange={(e) => setRt(e.target.value)}
          className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#64748B] outline-none"
        >
          <option value="">Pilih RT</option>
          <option value="RT 01">RT 01</option>
          <option value="RT 02">RT 02</option>
          <option value="RT 03">RT 03</option>
          <option value="RT 04">RT 04</option>
          <option value="RT 05">RT 05</option>
        </select>
        <button
          onClick={handleApplyFilter}
          className="h-10 rounded-xl bg-[#3B82F6] px-6 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
        >
          Terapkan
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-5 text-white">
          <Users className="mb-2 h-5 w-5 text-white/60" />
          <p className="text-xs text-white/70">Total warga</p>
          <p className="mt-1 text-2xl font-bold">{stats.totalWarga} <span className="text-sm font-medium">Jiwa</span></p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-5 text-white">
          <FileText className="mb-2 h-5 w-5 text-white/60" />
          <p className="text-xs text-white/70">Total KK</p>
          <p className="mt-1 text-2xl font-bold">{stats.totalKK} <span className="text-sm font-medium">Kartu Keluarga</span></p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-5 text-white">
          <RefreshCw className="mb-2 h-5 w-5 text-white/60" />
          <p className="text-xs text-white/70">Total Mutasi</p>
          <p className="mt-1 text-2xl font-bold">{stats.totalMutasi} <span className="text-sm font-medium">Laporan</span></p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="mb-6 text-base font-bold text-[#1E293B]">Distribusi Kelompok Umur</h3>
          <div className="flex items-end justify-between gap-4" style={{ height: 'clamp(150px, 25vh, 200px)' }}>
            {ageGroups.map((group) => (
              <div key={group.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#3B82F6]">{group.value} Jiwa</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#3B82F6] to-[#60A5FA] transition-all duration-500 ease-out"
                  style={{ height: `${(group.value / maxAgeValue) * 100}%`, minHeight: '16px' }}
                />
                <span className="text-xs font-medium text-[#64748B]">{group.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-6 text-white">
          <h3 className="mb-6 self-start text-base font-bold">Komposisi Gender</h3>
          <div className="relative">
            <div
              className="h-44 w-44 rounded-full"
              style={{
                background: `conic-gradient(#84CC16 0% ${(lakiLaki / genderTotal) * 100}%, #ffffff ${(lakiLaki / genderTotal) * 100}% 100%)`,
              }}
            />
            <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]">
              <span className="text-[11px] text-white/60">dari Total</span>
              <span className="text-lg font-bold">{filteredCitizens.length} Jiwa</span>
            </div>
          </div>
          <div className="mt-5 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#84CC16]" />
              <span>Laki-Laki <span className="font-bold">{Math.round((lakiLaki / genderTotal) * 100)}%</span> ({lakiLaki} Jiwa)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white" />
              <span>Perempuan <span className="font-bold">{Math.round((perempuan / genderTotal) * 100)}%</span> ({perempuan} Jiwa)</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-base font-bold text-[#1E293B]">Rekapitulasi Per RT</h3>
        <div className="overflow-x-auto overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#3B82F6] text-white">
                <th className="px-5 py-3.5 text-left font-semibold">Wilayah</th>
                <th className="px-5 py-3.5 text-left font-semibold">Kepala Keluarga</th>
                <th className="px-5 py-3.5 text-left font-semibold">Total warga</th>
                <th className="px-5 py-3.5 text-left font-semibold">Total Mutasi</th>
                <th className="px-5 py-3.5 text-left font-semibold">Usia Produktif</th>
                <th className="px-5 py-3.5 text-left font-semibold" />
              </tr>
            </thead>
            <tbody>
              {visibleRtData.map((row, i) => (
                <tr key={`${row.rt}-${row.rw}`} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#3B82F6]">RT {row.rt}</p>
                    <p className="text-xs text-[#94A3B8]">RW {row.rw}</p>
                  </td>
                  <td className="px-5 py-4 text-[#1E293B]">{row.kk}</td>
                  <td className="px-5 py-4 text-[#1E293B]">{row.warga}</td>
                  <td className="px-5 py-4 text-[#1E293B]">{row.mutasi}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[#64748B]">{row.produktif}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => void handleOpenDetail(row)}
                      className="inline-flex items-center justify-center rounded-xl bg-white p-2 text-[#3B82F6] shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
                      title="Lihat Detail Warga"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!viewedRT} onOpenChange={(open) => !open && setViewedRT(null)}>
        <DialogContent className="max-w-4xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Detail Warga - RT {viewedRT?.rt} / RW {viewedRT?.rw}</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">Menampilkan rincian data penduduk untuk wilayah RT {viewedRT?.rt}.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIK..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#3B82F6] focus:bg-white"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#EFF6FF] text-[#1E293B]">
                    <th className="px-4 py-3 text-left font-semibold">Nama Penduduk</th>
                    <th className="px-4 py-3 text-left font-semibold">NIK</th>
                    <th className="px-4 py-3 text-left font-semibold">Alamat</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPenduduk.length > 0 ? (
                    paginatedPenduduk.map((citizen) => (
                      <tr key={citizen.id} className="border-t border-gray-100 bg-white">
                        <td className="px-4 py-3 font-medium text-[#1E293B]">{citizen.name}</td>
                        <td className="px-4 py-3 text-[#64748B]">{citizen.nik}</td>
                        <td className="px-4 py-3 text-[#64748B]">{citizen.address}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">{citizen.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#64748B]">Data tidak ditemukan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-[#64748B]">
                  Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredPenduduk.length)} dari {filteredPenduduk.length} warga
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium text-[#1E293B]">Hal {currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
