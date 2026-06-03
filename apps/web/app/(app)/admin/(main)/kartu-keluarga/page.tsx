'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Search, SlidersHorizontal, Eye, UserPlus } from 'lucide-react';

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
  const [activeRt, setActiveRt] = useState<string>('');
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

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

    // Check for pending requests
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
        <Link
          href="/admin/kartu-keluarga/tambah"
          className="relative flex flex-1 items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-6 py-5 text-white shadow-lg transition hover:from-[#1D4ED8] hover:to-[#2563EB] active:scale-[0.99] sm:px-6 sm:py-5"
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.08]" />
          <div className="pointer-events-none absolute right-16 top-6 h-24 w-24 rounded-full bg-white/[0.12]" />
          <div className="pointer-events-none absolute -bottom-5 right-40 h-16 w-16 rounded-full bg-white/[0.08]" />

          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-xl font-bold">Tambah Kepala Keluarga</p>
            <p className="text-sm text-white/80">Kartu Keluarga</p>
          </div>
        </Link>

        <Link
          href="/admin/permohonan"
          className="relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-[#1E293B] transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
            <ClipboardList className="h-6 w-6 text-[#3B82F6]" />
            {hasPendingRequests && (
              <span className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
            )}
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">Permohonan</p>
            <p className="text-sm text-[#64748B]">Penambahan KK</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-full bg-[#2563EB] px-6 py-2.5">
          <span className="text-lg font-bold text-white">{rows.length}</span>
          <span className="ml-2 text-sm text-white/80">Total Kartu Keluarga</span>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
          <Input
            type="text"
            placeholder="Cari Kepala Keluarga, NIK, atau No. KK..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#3B82F6]"
          />
        </div>
        <div className="w-[180px] shrink-0">
          <Select value={activeRt === '' ? 'ALL' : activeRt} onValueChange={(val: any) => setActiveRt(val === 'ALL' ? '' : val)}>
            <SelectTrigger className="h-10 rounded-full border border-gray-200 bg-white font-medium text-gray-700 shadow-sm focus:ring-[#3B82F6]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#3B82F6]" />
                <SelectValue placeholder="Semua RT" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua RT</SelectItem>
              <SelectItem value="01">RT 01</SelectItem>
              <SelectItem value="02">RT 02</SelectItem>
              <SelectItem value="03">RT 03</SelectItem>
              <SelectItem value="04">RT 04</SelectItem>
              <SelectItem value="05">RT 05</SelectItem>
            </SelectContent>
          </Select>
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

        <div className="flex items-center justify-between border-t-0 bg-[#3B82F6] px-5 py-3 text-white">
          <span className="text-sm">
            Menampilkan {filteredKK.length} dari {rows.length} kartu keluarga
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm transition hover:bg-white/30 hover:text-white"
            >
              &lt;
            </Button>
            <span className="text-sm font-medium">Halaman 1</span>
            <Button
              variant="ghost"
              size="icon"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm transition hover:bg-white/30 hover:text-white"
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
