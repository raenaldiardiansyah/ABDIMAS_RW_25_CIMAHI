'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';

import { platformFetch } from '@/lib/api/platform';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/* ── Page ────────────────────────────────────────────────── */

export default function DataPendudukPage() {
  const [rows, setRows] = useState<
    Array<{
      id: string;
      nama: string;
      nik: string;
      noKK: string;
      alamat: string;
      status: 'Penduduk Tetap' | 'Ngekost';
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Penduduk Tetap' | 'Ngekost'>('ALL');

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const res = await platformFetch<Array<{
        id: string;
        name: string;
        nik: string;
        noKK: string;
        address: string;
        status: string;
      }>>('/admin/citizens?page=1&limit=50');
      
      const mapped = (res.data || []).map((c: any) => ({
        id: c.id,
        nama: c.name || '-',
        nik: c.nik || '-',
        noKK: c.noKK || '-',
        alamat: c.address || '-',
        status: c.status === 'NGEKOST' ? 'Ngekost' : 'Penduduk Tetap',
      }));
      setRows(mapped as any);
    } catch (e) {
      console.error('Failed to load citizens', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens();

    // Check for pending requests
    platformFetch<any[]>('/admin/requests?page=1&limit=1&status=PENDING')
      .then(({ data }) => {
        setHasPendingRequests(data.length > 0);
      })
      .catch(() => {
        // silently ignore error
      });

    return () => {
      // no-op
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data warga ${name}?`)) return;
    
    setDeletingId(id);
    try {
      await platformFetch(`/admin/citizens/${id}`, { method: 'DELETE' });
      await fetchCitizens();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus data warga.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch =
          row.nama.toLowerCase().includes(query.toLowerCase()) ||
          row.nik.includes(query) ||
          row.alamat.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [query, statusFilter, rows],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header Actions ── */}
      <div className="flex items-stretch justify-between gap-4">
        {/* Tambah Warga */}
        <Link
          href="/admin/data-penduduk/tambah"
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
            <p className="text-xl font-bold">Tambah Data Penduduk</p>
            <p className="text-sm text-white/80">Buat data penduduk baru</p>
          </div>
        </Link>

        {/* Permohonan */}
        <Link
          href="/admin/permohonan"
          className="relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-[#1E293B] transition hover:bg-gray-50 active:scale-[0.99]"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
            <UserPlus className="h-6 w-6 text-[#3B82F6]" />
            {/* Red dot notification */}
            {hasPendingRequests && (
              <span className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
            )}
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">Permohonan</p>
            <p className="text-sm text-[#64748B]">Penambahan warga</p>
          </div>
        </Link>
      </div>

      {/* ── Action Bar ── */}
      <div className="flex items-center gap-3">
        {/* Badge count */}
        <div className="shrink-0 rounded-full bg-[#2563EB] px-6 py-2.5">
          <span className="text-lg font-bold text-white">{rows.length}</span>
          <span className="ml-2 text-sm text-white/80">Total Penduduk</span>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
          <Input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#3B82F6]"
          />
        </div>

        {/* Filter button */}
        <div className="w-[180px]">
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="h-10 rounded-full border border-gray-200 bg-white font-medium text-gray-700 shadow-sm focus:ring-[#3B82F6]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#3B82F6]" />
                <SelectValue placeholder="Filter Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="Penduduk Tetap">Penduduk Tetap</SelectItem>
              <SelectItem value="Ngekost">Ngekost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="bg-[#3B82F6] hover:bg-[#3B82F6]">
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">Nama Lengkap</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">No.KK</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">Alamat</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white">Status</TableHead>
              <TableHead className="h-auto px-5 py-3.5 text-left font-semibold text-white" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={`border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FF]'} hover:bg-gray-50`}
                >
                  <TableCell className="px-5 py-4">
                    <p className="font-semibold text-[#1E293B]">{row.nama}</p>
                    <p className="text-xs text-[#3B82F6]">{row.nik}</p>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-[#64748B]">{row.noKK}</TableCell>
                  <TableCell className="px-5 py-4 text-[#64748B]">{row.alamat}</TableCell>
                  <TableCell className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${row.status === 'Penduduk Tetap'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/data-penduduk/${row.id}`}
                        className="rounded-full bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1D4ED8]"
                      >
                        Cek Detail
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleDelete(row.id, row.nama)}
                        disabled={deletingId === row.id}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 disabled:opacity-50 hover:text-red-700"
                        title="Hapus Warga"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center text-[#64748B]">
                  {loading ? 'Memuat data penduduk...' : 'Tidak ada data yang masuk.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ── Pagination Footer ── */}
        <div className="flex items-center justify-between bg-[#3B82F6] px-5 py-3 text-white">
          <span className="text-sm">
            Menampilkan 1 - {filteredRows.length} dari {rows.length} Penduduk
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm transition hover:bg-white/30 hover:text-white">
              &lt;
            </Button>
            <span className="text-sm font-medium">Halaman 1</span>
            <Button variant="ghost" size="icon" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm transition hover:bg-white/30 hover:text-white">
              &gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
