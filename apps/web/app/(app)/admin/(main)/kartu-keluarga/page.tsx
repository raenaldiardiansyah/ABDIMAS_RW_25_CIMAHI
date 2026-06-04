'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Search, SlidersHorizontal, Eye, Trash2, UserPlus } from 'lucide-react';

import { platformFetch } from '@/lib/api/platform';
import { useActionToast } from '@/lib/use-action-toast';

const PAGE_SIZE = 20;

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
  const { runWithToast } = useActionToast();
  const [rows, setRows] = useState<HouseholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [householdToDelete, setHouseholdToDelete] = useState<HouseholdRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeRt, setActiveRt] = useState<string>('');
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const query = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
        if (activeRt) query.set('rt', activeRt);
        if (debouncedSearchQuery) query.set('q', debouncedSearchQuery);
        const response = await platformFetch<HouseholdRow[]>(`/admin/households?${query.toString()}`);
        if (!active) return;
        setRows(response.data);
        setTotalItems(response.meta?.total ?? response.data.length);
        setTotalPages(response.meta?.totalPages ?? 1);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setRows([]);
        setTotalItems(0);
        setTotalPages(1);
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
  }, [activeRt, currentPage, debouncedSearchQuery]);

  const fetchHouseholds = async (page = currentPage, rt = activeRt, search = debouncedSearchQuery) => {
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (rt) query.set('rt', rt);
    if (search) query.set('q', search);

    const response = await platformFetch<HouseholdRow[]>(`/admin/households?${query.toString()}`);
    setRows(response.data);
    setTotalItems(response.meta?.total ?? response.data.length);
    setTotalPages(response.meta?.totalPages ?? 1);
  };

  const handleDelete = async () => {
    if (!householdToDelete) return;

    const { id } = householdToDelete;
    setDeletingId(id);
    try {
      await runWithToast(
        () => platformFetch(`/admin/households/${id}`, { method: 'DELETE' }),
        {
          loading: 'Deleting household...',
          success: 'Household deleted',
          error: 'Failed to delete household',
        },
      );

      const nextPage = rows.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        await fetchHouseholds(nextPage, activeRt, debouncedSearchQuery);
      }
      setHouseholdToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredKK = rows;

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
          <span className="text-lg font-bold text-white">{totalItems}</span>
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
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/kartu-keluarga/${row.id}`} className="transition hover:opacity-70">
                        <Eye className="h-5 w-5 text-[#3B82F6]" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setHouseholdToDelete(row)}
                        disabled={deletingId === row.id}
                        className="transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete household"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
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

        <div className="flex items-center justify-between border-t border-gray-100 bg-white/60 backdrop-blur-xl px-5 py-3 text-[#64748B]">
          <span className="text-sm">
            Menampilkan {filteredKK.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, totalItems)} dari {totalItems} kartu keluarga
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-sm text-[#1E293B] transition hover:bg-gray-100 disabled:opacity-50"
            >
              &lt;
            </Button>
            <span className="text-sm font-medium text-[#1E293B]">Halaman {currentPage} / {totalPages}</span>
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-sm text-[#1E293B] transition hover:bg-gray-100 disabled:opacity-50"
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!householdToDelete} onOpenChange={(open) => !open && setHouseholdToDelete(null)}>
        <AlertDialogContent className="max-w-md rounded-3xl border-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 via-red-500 to-orange-500 px-6 pb-14 pt-7 text-white">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Trash2 className="h-7 w-7" />
            </div>
            <AlertDialogHeader className="space-y-2 text-left">
              <AlertDialogTitle className="text-2xl font-bold leading-tight text-white">
                Hapus Kartu Keluarga?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-red-50">
                Data KK <span className="font-semibold text-white">{householdToDelete?.kkNumber}</span> akan dihapus
                bersama data relasi yang terhubung.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <div className="-mt-8 rounded-t-[28px] bg-white px-6 pb-6 pt-5">
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50/70 p-4">
              <p className="text-sm font-semibold text-[#1E293B]">
                Kepala Keluarga: <span className="text-red-600">{householdToDelete?.headCitizen?.name ?? '-'}</span>
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>

            <AlertDialogFooter className="flex flex-col gap-3 sm:flex-col sm:space-x-0">
              <AlertDialogAction
                onClick={() => void handleDelete()}
                className="h-12 w-full rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
              >
                Ya, Hapus Sekarang
              </AlertDialogAction>
              <AlertDialogCancel className="h-12 w-full rounded-2xl border-gray-200 text-sm font-bold text-[#64748B] hover:bg-gray-100">
                Batal
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
