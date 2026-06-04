'use client';

import { useEffect, useMemo, useState } from 'react';
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, Eye, ChatText as MessageSquareText, ArrowClockwise as RefreshCw, MagnifyingGlass as Search } from '@phosphor-icons/react';

import AdminAsyncState from '@/components/admin/AdminAsyncState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';
import { useAutoRefresh } from '@/lib/use-auto-refresh';

const PAGE_SIZE = 20;

type AspirationStatus = 'SUBMITTED' | 'REVIEWED' | 'RESOLVED';

type AspirationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: string | null;
  status: AspirationStatus;
  adminReply: {
    message: string;
    repliedAt: string;
    repliedById: string;
    repliedByName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  citizenName: string;
  citizenEmail: string;
  citizenRt: string | null;
  citizenRw: string | null;
};

type DashboardResponse = {
  notificationBadges: {
    pendingVerifications: number;
    pendingRequests: number;
    pendingMutations: number;
    pendingAspirations: number;
  };
};

function statusLabel(status: AspirationStatus) {
  if (status === 'RESOLVED') return 'Selesai';
  if (status === 'REVIEWED') return 'Ditanggapi';
  return 'Baru';
}

function statusTone(status: AspirationStatus) {
  if (status === 'RESOLVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REVIEWED') return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700';
}

export default function AdminLaporanPage() {
  const [rows, setRows] = useState<AspirationItem[]>([]);
  const [selected, setSelected] = useState<AspirationItem | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse['notificationBadges'] | null>(null);
  const [status, setStatus] = useState<'ALL' | AspirationStatus>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState<AspirationStatus>('REVIEWED');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadRows(targetPage = page, preserveSelectedId?: string | null) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });
      if (status !== 'ALL') params.set('status', status);
      if (debouncedSearch) params.set('q', debouncedSearch);

      const response = await platformFetch<AspirationItem[]>(`/admin/aspirations?${params.toString()}`);
      setRows(response.data);
      setTotalItems(response.meta?.total ?? response.data.length);
      setTotalPages(response.meta?.totalPages ?? 1);
      setLoadError(null);

      if (preserveSelectedId) {
        const candidate = response.data.find((item) => item.id === preserveSelectedId) ?? null;
        if (candidate) {
          const detail = await platformFetch<AspirationItem>(`/admin/aspirations/${preserveSelectedId}`);
          setSelected(detail.data);
          setReplyMessage(detail.data.adminReply?.message ?? '');
          setReplyStatus(detail.data.status === 'SUBMITTED' ? 'REVIEWED' : detail.data.status);
        } else {
          setSelected(null);
          setReplyMessage('');
        }
      }
    } catch (error) {
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoadError(getPlatformErrorMessage(error, 'Gagal memuat aduan warga.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows(page, selected?.id ?? null);
  }, [page, status, debouncedSearch]);

  useAutoRefresh(() => loadRows(page, selected?.id ?? null), {
    intervalMs: 8000,
  });

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const response = await platformFetch<DashboardResponse>('/admin/dashboard');
        if (!active) return;
        setDashboard(response.data.notificationBadges);
      } catch {
        if (active) setDashboard(null);
      }
    }

    void loadSummary();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const submitted = rows.filter((item) => item.status === 'SUBMITTED').length;
    const reviewed = rows.filter((item) => item.status === 'REVIEWED').length;
    const resolved = rows.filter((item) => item.status === 'RESOLVED').length;
    return { submitted, reviewed, resolved };
  }, [rows]);

  async function openDetail(item: AspirationItem) {
    const response = await platformFetch<AspirationItem>(`/admin/aspirations/${item.id}`);
    setSelected(response.data);
    setReplyMessage(response.data.adminReply?.message ?? '');
    setReplyStatus(response.data.status === 'SUBMITTED' ? 'REVIEWED' : response.data.status);
  }

  async function submitReply() {
    if (!selected || !replyMessage.trim()) return;

    setSaving(true);
    try {
      await platformFetch(`/admin/aspirations/${selected.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          replyMessage: replyMessage.trim(),
          status: replyStatus,
        }),
      });
      await loadRows(page, selected.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[clamp(14px,1.5vw,18px)] font-bold text-[#1E293B]">Aduan Warga</h2>
          <p className="mt-1 text-sm text-[#64748B]">Kelola laporan warga dan kirim tanggapan admin.</p>
        </div>
        <Button
          onClick={() => void loadRows(page, selected?.id ?? null)}
          className="rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Muat Ulang
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Aduan baru" value={dashboard?.pendingAspirations ?? summary.submitted} />
        <SummaryCard label="Sudah ditanggapi" value={summary.reviewed} />
        <SummaryCard label="Selesai" value={summary.resolved} />
        <SummaryCard label="Total halaman ini" value={rows.length} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, isi laporan, nama, atau email warga..."
            className="rounded-xl border-gray-200 pl-10"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'ALL' | AspirationStatus);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#1E293B]"
        >
          <option value="ALL">Semua status</option>
          <option value="SUBMITTED">Baru</option>
          <option value="REVIEWED">Ditanggapi</option>
          <option value="RESOLVED">Selesai</option>
        </select>
      </div>

      {loadError ? (
        <AdminAsyncState
          mode="error"
          page="Aduan Warga"
          action="memuat aduan warga"
          description={loadError}
          onRetry={() => void loadRows(page, selected?.id ?? null)}
        />
      ) : (
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] text-[#2563EB]">
              <th className="px-5 py-4 text-left font-semibold">Pelapor</th>
              <th className="px-5 py-4 text-left font-semibold">Aduan</th>
              <th className="px-5 py-4 text-left font-semibold">Kategori</th>
              <th className="px-5 py-4 text-left font-semibold">Status</th>
              <th className="px-5 py-4 text-left font-semibold">Tanggal</th>
              <th className="px-5 py-4 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#64748B]">
                  {loading ? (
                    <AdminAsyncState
                      mode="loading"
                      page="Aduan Warga"
                      action="memuat aduan warga"
                      compact
                      className="border-0 bg-transparent p-0 shadow-none"
                    />
                  ) : (
                    'Tidak ada aduan pada filter ini.'
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1E293B]">{row.citizenName}</p>
                    <p className="text-xs text-[#64748B]">
                      {row.citizenEmail}
                      {(row.citizenRt || row.citizenRw) ? ` • RT ${row.citizenRt ?? '-'} / RW ${row.citizenRw ?? '-'}` : ''}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1E293B]">{row.title}</p>
                    <p className="line-clamp-2 text-xs text-[#64748B]">{row.message}</p>
                  </td>
                  <td className="px-5 py-4 text-[#1E293B]">{row.category ?? '-'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#64748B]">
                    {new Date(row.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      onClick={() => void openDetail(row)}
                      className="rounded-xl bg-white text-[#2563EB] ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Detail
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-[#64748B]">
          Menampilkan {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, totalItems)} dari {totalItems} aduan
        </span>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white p-0 text-[#64748B] hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-[#1E293B]">Hal {page} / {Math.max(totalPages, 1)}</span>
          <Button
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page >= totalPages}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white p-0 text-[#64748B] hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Detail Aduan Warga</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Tinjau laporan warga dan kirim tanggapan admin.
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#F8FAFC] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Pelapor</p>
                  <p className="mt-1 text-base font-bold text-[#1E293B]">{selected.citizenName}</p>
                  <p className="text-sm text-[#64748B]">{selected.citizenEmail}</p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    RT {selected.citizenRt ?? '-'} / RW {selected.citizenRw ?? '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Judul</p>
                      <h3 className="mt-1 text-lg font-bold text-[#1E293B]">{selected.title}</h3>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(selected.status)}`}>
                      {statusLabel(selected.status)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[#475569]">{selected.message}</p>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#64748B]">
                    <span>Kategori: {selected.category ?? '-'}</span>
                    <span>Dibuat: {new Date(selected.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {selected.adminReply ? (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <div className="flex items-center gap-2 text-sky-700">
                      <MessageSquareText className="h-4 w-4" />
                      <p className="text-sm font-semibold">Tanggapan terakhir</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{selected.adminReply.message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {selected.adminReply.repliedByName} • {new Date(selected.adminReply.repliedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-sm font-bold text-[#1E293B]">Balas Komentar</p>
                <p className="mt-1 text-xs text-[#64748B]">Tanggapan ini akan tampil kembali di portal warga.</p>

                <div className="mt-4 space-y-4">
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value as AspirationStatus)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#1E293B]"
                  >
                    <option value="REVIEWED">Simpan sebagai ditanggapi</option>
                    <option value="RESOLVED">Simpan sebagai selesai</option>
                  </select>

                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Tulis tanggapan admin..."
                    rows={8}
                    className="rounded-2xl border-gray-200"
                  />

                  <Button
                    onClick={() => void submitReply()}
                    disabled={saving || !replyMessage.trim()}
                    className="w-full rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  >
                    {saving ? 'Menyimpan...' : 'Kirim Tanggapan'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#2563EB] p-5 text-white">
      <p className="text-xs text-white/75">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
