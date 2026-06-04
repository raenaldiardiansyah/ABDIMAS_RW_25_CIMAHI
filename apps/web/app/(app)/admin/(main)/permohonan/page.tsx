'use client';
import { Button } from '@/components/ui/button';

import { useEffect, useState } from 'react';
import { FileInput, CheckCircle2, XCircle, Eye, RefreshCw } from 'lucide-react';

import AdminAsyncState from '@/components/admin/AdminAsyncState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';
import { useAutoRefresh } from '@/lib/use-auto-refresh';
import { useActionToast } from '@/lib/use-action-toast';

const PAGE_SIZE = 20;

type RequestItem = {
  id: string;
  type: 'HOUSEHOLD_CREATE' | 'MUTATION_IN' | 'MUTATION_OUT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payload: Record<string, unknown>;
  rejectionReason: string | null;
  createdAt: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function PermohonanPage() {
  const { runWithToast } = useActionToast();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewedAnggota, setViewedAnggota] = useState<RequestItem | null>(null);
  const [viewedMutasi, setViewedMutasi] = useState<RequestItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await platformFetch<RequestItem[]>(`/admin/requests?page=${currentPage}&limit=${PAGE_SIZE}&status=PENDING`);
        if (!active) return;
        setRequests(response.data);
        setTotalItems(response.meta?.total ?? response.data.length);
        setTotalPages(response.meta?.totalPages ?? 1);
        setLoadError(null);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setRequests([]);
        setTotalItems(0);
        setTotalPages(1);
        setLoadError(getPlatformErrorMessage(error, 'Gagal memuat permohonan.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [currentPage, reloadKey]);

  useAutoRefresh(async () => {
    const response = await platformFetch<RequestItem[]>(`/admin/requests?page=${currentPage}&limit=${PAGE_SIZE}&status=PENDING`);
    setRequests(response.data);
    setTotalItems(response.meta?.total ?? response.data.length);
    setTotalPages(response.meta?.totalPages ?? 1);
  }, {
    intervalMs: 8000,
  });

  const permohonan = requests.filter((item) => item.type === 'HOUSEHOLD_CREATE');
  const permohonanMutasi = requests.filter((item) => item.type !== 'HOUSEHOLD_CREATE');

  const handleApprove = async (id: string) => {
    try {
      await runWithToast(
        () => platformFetch<RequestItem>(`/admin/requests/${id}/approve`, { method: 'POST' }),
        {
          loading: 'Menyetujui permohonan...',
          success: 'Permohonan disetujui',
          error: 'Gagal menyetujui permohonan',
        },
      );
      setRequests((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await runWithToast(
        () =>
          platformFetch<RequestItem>(`/admin/requests/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: 'Rejected by admin' }),
          }),
        {
          loading: 'Menolak permohonan...',
          success: 'Permohonan ditolak',
          error: 'Gagal menolak permohonan',
        },
      );
      setRequests((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    }
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

      {loadError ? (
        <AdminAsyncState
          mode="error"
          page="Permohonan"
          action="memuat permohonan"
          description={loadError}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
      <>
      <div className="flex flex-col gap-4">
        <h2 className="border-b border-gray-100 pb-2 text-lg font-bold text-[#1E293B]">
          Permohonan Kartu Keluarga Baru
        </h2>
        {permohonan.length === 0 ? (
          loading ? (
            <AdminAsyncState
              mode="loading"
              page="Permohonan"
              action="memuat permohonan"
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <CheckCircle2 className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-[#1E293B]">Tidak ada permohonan baru</h3>
              <p className="text-xs text-[#64748B]">Semua permohonan KK telah diverifikasi.</p>
            </div>
          )
        ) : (
          permohonan.map((item) => {
            const payload = item.payload as {
              household?: { address?: string; headCitizenId?: string };
              members?: Array<{ nama?: string; relationship?: string; nik?: string; citizenId?: string }>;
            };

            return (
              <div
                key={item.id}
                className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                    <FileInput className="h-6 w-6 text-[#3B82F6]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-[#1E293B]">
                        {payload.members?.[0]?.nama ?? payload.household?.headCitizenId ?? 'Permohonan KK'}
                      </h2>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                        Menunggu
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#3B82F6]">Pendaftaran Kartu Keluarga Baru</p>

                    <div className="mt-3 flex flex-col gap-1 text-sm text-[#64748B] sm:flex-row sm:items-center sm:gap-4">
                      <p>
                        Ref ID: <span className="font-semibold text-[#1E293B]">{item.id}</span>
                      </p>
                      <span className="hidden sm:inline">•</span>
                      <p>
                        Tanggal: <span className="font-semibold text-[#1E293B]">{formatDate(item.createdAt)}</span>
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-[#64748B]">{payload.household?.address ?? '-'}</p>
                  </div>
                </div>

                <div className="w-full shrink-0 items-center justify-end gap-3 border-t border-gray-100 pt-4 md:flex md:w-auto md:border-none md:pt-0">
                  <Button
                    onClick={() => setViewedAnggota(item)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 md:flex-none"
                    title="Lihat Daftar Keluarga"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => void handleReject(item.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 md:flex-none"
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="hidden md:inline">Tolak</span>
                  </Button>
                  <Button
                    onClick={() => void handleApprove(item.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 md:flex-none"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden md:inline">Setujui</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <h2 className="border-b border-gray-100 pb-2 text-lg font-bold text-[#1E293B]">
          Permohonan Mutasi Penduduk
        </h2>
        {permohonanMutasi.length === 0 ? (
          loading ? (
            <AdminAsyncState
              mode="loading"
              page="Permohonan"
              action="memuat permohonan"
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                <CheckCircle2 className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-[#1E293B]">Tidak ada permohonan baru</h3>
              <p className="text-xs text-[#64748B]">Semua permohonan Mutasi telah diverifikasi.</p>
            </div>
          )
        ) : (
          permohonanMutasi.map((item) => {
            const payload = item.payload as {
              citizenId?: string;
              fromAddress?: string;
              toAddress?: string;
              reason?: string;
              nama?: string;
              nik?: string;
            };

            return (
              <div
                key={item.id}
                className="flex flex-col gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                    <RefreshCw className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-[#1E293B]">
                        {payload.nama ?? payload.citizenId ?? 'Permohonan Mutasi'}
                      </h2>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                        Menunggu
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-indigo-500">
                      {item.type === 'MUTATION_IN' ? 'Mutasi Masuk' : 'Mutasi Keluar'}
                    </p>

                    <div className="mt-3 flex flex-col gap-1 text-sm text-[#64748B] sm:flex-row sm:items-center sm:gap-4">
                      <p>
                        Ref ID: <span className="font-semibold text-[#1E293B]">{item.id}</span>
                      </p>
                      <span className="hidden sm:inline">•</span>
                      <p>
                        Tanggal: <span className="font-semibold text-[#1E293B]">{formatDate(item.createdAt)}</span>
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#1E293B]">Alasan: {payload.reason ?? '-'}</p>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {payload.toAddress ?? payload.fromAddress ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="w-full shrink-0 items-center justify-end gap-3 border-t border-gray-100 pt-4 md:flex md:w-auto md:border-none md:pt-0">
                  <Button
                    onClick={() => setViewedMutasi(item)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 md:flex-none"
                    title="Lihat Keterangan"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => void handleReject(item.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 md:flex-none"
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="hidden md:inline">Tolak</span>
                  </Button>
                  <Button
                    onClick={() => void handleApprove(item.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-600 md:flex-none"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden md:inline">Setujui</span>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-[#3B82F6] px-5 py-3 text-white">
        <span className="text-sm">
          Menampilkan {requests.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, totalItems)} dari {totalItems} permohonan
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-50">
            {'<'}
          </Button>
          <span className="text-sm font-medium">Halaman {currentPage} / {totalPages}</span>
          <Button type="button" variant="ghost" size="icon" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-50">
            {'>'}
          </Button>
        </div>
      </div>
      </>
      )}

      <Dialog open={!!viewedAnggota} onOpenChange={(open) => !open && setViewedAnggota(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Detail Keluarga</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Daftar anggota keluarga yang diajukan dalam permohonan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            {((viewedAnggota?.payload as { members?: Array<{ nama?: string; relationship?: string; nik?: string; citizenId?: string }> })?.members ?? []).map((anggota, idx) => (
              <div
                key={`${anggota.citizenId ?? anggota.nik ?? idx}`}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <p className="font-bold text-[#1E293B]">{anggota.nama ?? anggota.citizenId ?? '-'}</p>
                  <p className="text-xs font-semibold text-[#3B82F6]">{anggota.nik ?? '-'}</p>
                </div>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                  {anggota.relationship ?? '-'}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="font-bold text-[#1E293B]">
                  {((viewedMutasi.payload as { nama?: string; citizenId?: string }).nama ??
                    (viewedMutasi.payload as { citizenId?: string }).citizenId ??
                    '-')}
                </p>
                <p className="mt-1 text-sm font-semibold text-indigo-500">
                  {viewedMutasi.type === 'MUTATION_IN' ? 'Mutasi Masuk' : 'Mutasi Keluar'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Alamat saat ini / tujuan</p>
                <p className="mt-1 text-sm text-[#1E293B]">
                  {((viewedMutasi.payload as { toAddress?: string; fromAddress?: string }).toAddress ??
                    (viewedMutasi.payload as { fromAddress?: string }).fromAddress ??
                    '-')}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Alasan</p>
                <p className="mt-1 text-sm font-medium text-[#1E293B]">
                  {((viewedMutasi.payload as { reason?: string }).reason ?? '-')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
