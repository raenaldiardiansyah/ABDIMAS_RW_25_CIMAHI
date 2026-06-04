'use client';

import { useEffect, useState } from 'react';
import { CheckCircle as CheckCircle2, Eye, MagnifyingGlass as Search, ShieldCheck, XCircle } from '@phosphor-icons/react';

import type { AdminVerificationBuckets, AdminVerificationItem, VerificationStatus } from '@abdimas/contracts';

import AdminAsyncState from '@/components/admin/AdminAsyncState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';
import { useActionToast } from '@/lib/use-action-toast';
import { cn } from '@/lib/utils';

const STATUSES: VerificationStatus[] = ['PENDING', 'VERIFIED', 'REJECTED'];
const STATUS_KEYS: Record<VerificationStatus, keyof AdminVerificationBuckets> = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

type VerificationActionResponse = {
  userId: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function statusBadgeClass(status: VerificationStatus) {
  if (status === 'VERIFIED') return 'border-[color:var(--admin-success-border)] bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success-foreground)]';
  if (status === 'REJECTED') return 'border-[color:var(--admin-danger-border)] bg-[color:var(--admin-danger-soft)] text-[color:var(--admin-danger-foreground)]';
  return 'border-[color:var(--admin-warning-border)] bg-[color:var(--admin-warning-soft)] text-[color:var(--admin-warning-foreground)]';
}

export default function AdminVerificationPage() {
  const { runWithToast } = useActionToast();
  const [status, setStatus] = useState<VerificationStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [buckets, setBuckets] = useState<AdminVerificationBuckets>({
    pending: [],
    verified: [],
    rejected: [],
    counts: {
      pending: 0,
      verified: 0,
      rejected: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState<AdminVerificationItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<AdminVerificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actingUserId, setActingUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 1000);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        const suffix = params.toString();
        const response = await platformFetch<AdminVerificationBuckets>(`/admin/verifications${suffix ? `?${suffix}` : ''}`);
        if (!active) return;
        setBuckets(response.data);
        setLoadError(null);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setBuckets({
          pending: [],
          verified: [],
          rejected: [],
          counts: {
            pending: 0,
            verified: 0,
            rejected: 0,
          },
        });
        setLoadError(getPlatformErrorMessage(error, 'Gagal memuat data verifikasi.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [query, reloadKey]);

  const items = buckets[STATUS_KEYS[status]] as AdminVerificationItem[];
  const counts = buckets.counts;

  const moveItemToStatus = (
    current: AdminVerificationBuckets,
    item: AdminVerificationItem,
    nextStatus: Extract<VerificationStatus, 'VERIFIED' | 'REJECTED'>,
    rejectionReason?: string | null,
    verifiedAt?: string | null,
    verifiedBy?: string | null,
  ): AdminVerificationBuckets => {
    const updatedItem: AdminVerificationItem = {
      ...item,
      verificationStatus: nextStatus,
      rejectionReason: rejectionReason ?? (nextStatus === 'REJECTED' ? item.rejectionReason ?? null : null),
      verifiedAt: verifiedAt ?? item.verifiedAt ?? null,
      verifiedBy: verifiedBy ?? item.verifiedBy ?? null,
    };

    return {
      pending: current.pending.filter((entry) => entry.userId !== item.userId),
      verified:
        nextStatus === 'VERIFIED'
          ? [updatedItem, ...current.verified.filter((entry) => entry.userId !== item.userId)]
          : current.verified.filter((entry) => entry.userId !== item.userId),
      rejected:
        nextStatus === 'REJECTED'
          ? [updatedItem, ...current.rejected.filter((entry) => entry.userId !== item.userId)]
          : current.rejected.filter((entry) => entry.userId !== item.userId),
      counts: {
        pending: Math.max(0, current.counts.pending - 1),
        verified: current.counts.verified + (nextStatus === 'VERIFIED' ? 1 : 0),
        rejected: current.counts.rejected + (nextStatus === 'REJECTED' ? 1 : 0),
      },
    };
  };

  const handleApprove = async (item: AdminVerificationItem) => {
    setActingUserId(item.userId);
    try {
      const response = await runWithToast(
        () => platformFetch<VerificationActionResponse>(`/admin/verifications/${item.userId}/approve`, { method: 'POST' }),
        {
          loading: 'Menyetujui verifikasi...',
          success: 'Verifikasi disetujui',
          error: 'Gagal menyetujui verifikasi',
        },
      );
      setBuckets((current) =>
        moveItemToStatus(current, item, 'VERIFIED', null, response.data.verifiedAt ?? null, response.data.verifiedBy ?? null),
      );
      setSelectedItem((current) =>
        current?.userId === item.userId
          ? {
              ...current,
              verificationStatus: 'VERIFIED',
              rejectionReason: null,
              verifiedAt: response.data.verifiedAt ?? null,
              verifiedBy: response.data.verifiedBy ?? null,
            }
          : current,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setActingUserId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingItem || !rejectReason.trim()) return;
    setActingUserId(rejectingItem.userId);

    try {
      const response = await runWithToast(
        () =>
          platformFetch<VerificationActionResponse>(`/admin/verifications/${rejectingItem.userId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: rejectReason.trim() }),
          }),
        {
          loading: 'Menolak verifikasi...',
          success: 'Verifikasi ditolak',
          error: 'Gagal menolak verifikasi',
        },
      );
      setBuckets((current) =>
        moveItemToStatus(
          current,
          rejectingItem,
          'REJECTED',
          response.data.rejectionReason ?? rejectReason.trim(),
          response.data.verifiedAt ?? null,
          response.data.verifiedBy ?? null,
        ),
      );
      setSelectedItem((current) =>
        current?.userId === rejectingItem.userId
          ? {
              ...current,
              verificationStatus: 'REJECTED',
              rejectionReason: response.data.rejectionReason ?? rejectReason.trim(),
              verifiedAt: response.data.verifiedAt ?? null,
              verifiedBy: response.data.verifiedBy ?? null,
            }
          : current,
      );
      setRejectingItem(null);
      setRejectReason('');
    } catch (error) {
      console.error(error);
    } finally {
      setActingUserId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[color:var(--admin-gradient-from)] to-[color:var(--admin-gradient-to)] px-6 py-6 text-primary-foreground shadow-lg">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.08]" />
        <div className="pointer-events-none absolute right-16 top-6 h-24 w-24 rounded-full bg-white/[0.12]" />
        <div className="pointer-events-none absolute -bottom-5 right-40 h-16 w-16 rounded-full bg-white/[0.08]" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Verifikasi Warga</h1>
            <p className="mt-1 text-sm text-white/80">Kelola antrian verifikasi identitas warga.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-white/70">Pending</p>
              <p className="mt-1 text-2xl font-bold">{counts.pending}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-white/70">Verified</p>
              <p className="mt-1 text-2xl font-bold">{counts.verified}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-white/70">Rejected</p>
              <p className="mt-1 text-2xl font-bold">{counts.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={status} onValueChange={(value) => setStatus(value as VerificationStatus)}>
            <TabsList className="h-auto rounded-2xl bg-[color:var(--admin-surface-soft)] p-1">
              {STATUSES.map((item) => (
                <TabsTrigger
                  key={item}
                  value={item}
                  className="rounded-xl px-4 py-2 text-xs font-bold transition-all data-[state=active]:border data-[state=active]:border-[#3B82F6] data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#3B82F6] data-[state=active]:shadow-sm"
                >
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-muted)]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, username, atau email"
              className="h-11 rounded-2xl border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] pl-10"
            />
          </div>
        </div>

        {loadError ? (
          <AdminAsyncState
            mode="error"
            page="Verifikasi Warga"
            action="memuat data verifikasi"
            description={loadError}
            onRetry={() => setReloadKey((value) => value + 1)}
          />
        ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[color:var(--admin-border)]">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="relative overflow-hidden bg-[#3B82F6]">
                <TableRow className="border-b-[#3B82F6] text-left text-xs font-bold uppercase tracking-wide text-white hover:bg-[#3B82F6]">
                  <TableHead className="px-5 py-4 text-white">
                    <div className="pointer-events-none absolute -left-4 -top-4 h-16 w-16 rounded-full bg-white/[0.08]" />
                    <span className="relative z-10">Warga</span>
                  </TableHead>
                  <TableHead className="relative z-10 px-5 py-4 text-white">NIK</TableHead>
                  <TableHead className="relative z-10 px-5 py-4 text-white">Status</TableHead>
                  <TableHead className="relative z-10 px-5 py-4 text-white">Tanggal Daftar</TableHead>
                  <TableHead className="relative z-10 px-5 py-4 text-white">Tanggal Verifikasi</TableHead>
                  <TableHead className="relative z-10 px-5 py-4 text-white">Alasan</TableHead>
                  <TableHead className="px-5 py-4 text-right text-white">
                    <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/[0.08]" />
                    <span className="relative z-10">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-[color:var(--admin-surface)]">
                {items.map((item, index) => (
                  <TableRow key={item.userId} className={cn("border-b-[color:var(--admin-border)] hover:bg-[#F1F5F9] transition-colors", index % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]")}>
                    <TableCell className="px-5 py-4">
                      <p className="font-bold text-[color:var(--admin-heading)]">{item.fullName}</p>
                      <p className="text-xs text-[color:var(--admin-subtle)]">@{item.username}</p>
                      <p className="text-xs text-[color:var(--admin-subtle)]">{item.email}</p>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-medium text-[color:var(--admin-body)]">{item.maskedNik}</TableCell>
                    <TableCell className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(item.verificationStatus)}`}>
                        {item.verificationStatus}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-[color:var(--admin-body)]">{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-[color:var(--admin-body)]">{formatDate(item.verifiedAt)}</TableCell>
                    <TableCell className="max-w-[220px] px-5 py-4 text-sm text-[color:var(--admin-subtle)]">
                      <span className="line-clamp-2">{item.rejectionReason || '-'}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedItem(item)}
                          disabled={actingUserId === item.userId}
                          className="h-10 w-10 rounded-xl border-gray-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.verificationStatus === 'PENDING' ? (
                          <>
                            <Button
                              type="button"
                              onClick={() => setRejectingItem(item)}
                              disabled={actingUserId === item.userId}
                              className="rounded-xl border-[color:var(--admin-danger-border)] bg-[color:var(--admin-danger-soft)] px-4 text-[color:var(--admin-danger-foreground)] hover:bg-[color:var(--admin-danger-soft)]/80"
                            >
                              <XCircle className="h-4 w-4" />
                              Tolak
                            </Button>
                            <Button
                              type="button"
                              onClick={() => void handleApprove(item)}
                              disabled={actingUserId === item.userId}
                              className="rounded-xl bg-primary px-4 text-primary-foreground hover:bg-[color:var(--admin-primary-strong)]"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Setujui
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-[color:var(--admin-subtle)]">
                      Tidak ada data verifikasi untuk filter ini.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-[color:var(--admin-subtle)]">
                      <AdminAsyncState
                        mode="loading"
                        page="Verifikasi Warga"
                        action="memuat data verifikasi"
                        compact
                        className="border-0 bg-transparent p-0 shadow-none"
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[color:var(--admin-heading)]">Detail Verifikasi</DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--admin-subtle)]">
              Informasi akun dan status verifikasi warga.
            </DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4">
                <p className="text-lg font-bold text-[color:var(--admin-heading)]">{selectedItem.fullName}</p>
                <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">@{selectedItem.username}</p>
                <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">{selectedItem.email}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--admin-border)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-subtle)]">NIK</p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--admin-heading)]">{selectedItem.maskedNik}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--admin-border)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-subtle)]">Status</p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--admin-heading)]">{selectedItem.verificationStatus}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--admin-border)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-subtle)]">Alasan Penolakan</p>
                <p className="mt-1 text-sm text-[color:var(--admin-heading)]">{selectedItem.rejectionReason || '-'}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectingItem}
        onOpenChange={(open) => {
          if (open) return;
          setRejectingItem(null);
          setRejectReason('');
        }}
      >
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[color:var(--admin-heading)]">Tolak Verifikasi</DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--admin-subtle)]">
              Alasan penolakan wajib diisi agar warga mendapat feedback yang jelas.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4">
              <p className="font-bold text-[color:var(--admin-heading)]">{rejectingItem?.fullName}</p>
              <p className="mt-1 text-xs text-[color:var(--admin-subtle)]">@{rejectingItem?.username}</p>
              <p className="mt-1 text-xs text-[color:var(--admin-subtle)]">{rejectingItem?.email}</p>
            </div>
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Contoh: Foto KTP tidak jelas atau data NIK tidak sesuai."
              className="min-h-[120px] rounded-2xl border-[color:var(--admin-border)]"
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void handleReject()}
                disabled={!rejectReason.trim() || actingUserId === rejectingItem?.userId}
                className="rounded-xl bg-[color:var(--status-error)] text-white hover:bg-[color:var(--admin-danger-foreground)]"
              >
                Tolak Verifikasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
