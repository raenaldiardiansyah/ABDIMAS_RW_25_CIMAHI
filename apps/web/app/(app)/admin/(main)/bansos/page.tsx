'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, HandCoins, PlusCircle, XCircle } from 'lucide-react';

import AdminAsyncState from '@/components/admin/AdminAsyncState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';
import { formatBansosPeriod } from '@/lib/bansos';
import { useActionToast } from '@/lib/use-action-toast';

type RequirementValue =
  | 'SALARY_BELOW_UMR'
  | 'NON_PNS'
  | 'NON_PENSIONER'
  | 'NON_MILITARY'
  | 'LOW_INCOME'
  | 'HAS_DEPENDENTS'
  | 'SENIOR_CITIZEN'
  | 'DISABILITY';

type BansosProgram = {
  id: string;
  title: string;
  assistanceType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  fundingSource: string;
  generalRequirements: RequirementValue[];
  allowedRtScope: string[];
  createdAt: string;
};

type BansosApplication = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  payload: {
    programId: string;
    title: string;
    assistanceType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    fundingSource: string;
    generalRequirements: RequirementValue[];
    allowedRtScope: string[];
    applicantCitizenId: string;
    applicantName: string;
    applicantNik: string;
    applicantRt: string;
    applicantRw: string;
    incomeAmount: string;
    notes: string | null;
    attachments: Array<{
      kind: 'POVERTY_CERTIFICATE' | 'HOUSE_PHOTO' | 'INCOME_PROOF';
      label: string;
      storageKey: string;
      originalFilename: string;
      mimeType: string;
      size: number;
      url?: string | null;
    }>;
  };
};

const requirementLabelMap: Record<RequirementValue, string> = {
  SALARY_BELOW_UMR: 'Gaji di bawah UMR',
  NON_PNS: 'Bukan PNS',
  NON_PENSIONER: 'Bukan pensiunan',
  NON_MILITARY: 'Bukan TNI/Polri',
  LOW_INCOME: 'Keluarga berpenghasilan rendah',
  HAS_DEPENDENTS: 'Memiliki tanggungan keluarga',
  SENIOR_CITIZEN: 'Lansia',
  DISABILITY: 'Disabilitas',
};

export default function AdminBansosPage() {
  const { runWithToast, toast } = useActionToast();
  const [items, setItems] = useState<BansosProgram[]>([]);
  const [applications, setApplications] = useState<BansosApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewedApplication, setViewedApplication] = useState<BansosApplication | null>(null);
  const [rejectingApplication, setRejectingApplication] = useState<BansosApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [programResponse, applicationResponse] = await Promise.all([
          platformFetch<BansosProgram[]>('/admin/bansos?page=1&limit=50'),
          platformFetch<BansosApplication[]>('/admin/bansos/applications?page=1&limit=50&status=PENDING'),
        ]);
        if (!active) return;
        setItems(programResponse.data);
        setApplications(applicationResponse.data);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setItems([]);
        setApplications([]);
        setError(getPlatformErrorMessage(loadError, 'Gagal memuat bansos.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleApproveApplication = async (id: string) => {
    try {
      await runWithToast(
        () => platformFetch(`/admin/bansos/applications/${id}/approve`, { method: 'POST' }),
        {
          loading: 'Menyetujui pengajuan bansos...',
          success: 'Pengajuan bansos disetujui',
          error: 'Gagal menyetujui pengajuan bansos',
        },
      );
      setApplications((prev) => prev.filter((item) => item.id !== id));
      if (viewedApplication?.id === id) setViewedApplication(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectApplication = async () => {
    if (!rejectingApplication) return;
    if (!rejectReason.trim()) {
      toast({
        title: 'Alasan wajib diisi',
        description: 'Masukkan alasan penolakan pengajuan bansos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await runWithToast(
        () =>
          platformFetch(`/admin/bansos/applications/${rejectingApplication.id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: rejectReason.trim() }),
          }),
        {
          loading: 'Menolak pengajuan bansos...',
          success: 'Pengajuan bansos ditolak',
          error: 'Gagal menolak pengajuan bansos',
        },
      );
      setApplications((prev) => prev.filter((item) => item.id !== rejectingApplication.id));
      setRejectingApplication(null);
      setRejectReason('');
      if (viewedApplication?.id === rejectingApplication.id) setViewedApplication(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--admin-heading)]">Bansos</h1>
          <p className="mt-2 text-sm text-[color:var(--admin-subtle)]">
            Kelola program bansos aktif dan tinjau pengajuan warga langsung dari halaman ini.
          </p>
        </div>
        <Button
          asChild
          className="rounded-2xl bg-[color:var(--admin-primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--admin-primary-strong)]"
        >
          <Link href="/admin/bansos/tambah">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Bansos
          </Link>
        </Button>
      </div>

      {error ? (
        <AdminAsyncState
          mode="error"
          page="Bansos"
          action="memuat data bansos"
          description={error}
          onRetry={() => {
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
        />
      ) : loading ? (
        <AdminAsyncState mode="loading" page="Bansos" action="memuat data bansos" />
      ) : (
        <>
          {items.length === 0 ? (
            <Card className="rounded-3xl border-2 border-dashed border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--admin-surface-soft)]">
                <CheckCircle2 className="h-6 w-6 text-[color:var(--admin-muted)]" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[color:var(--admin-heading)]">Belum ada program bansos</h3>
              <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">Tambahkan program pertama dari halaman tambah bansos.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <Card key={item.id} className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)]">
                        <HandCoins className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-[color:var(--admin-heading)]">{item.title}</h2>
                          <Badge className="rounded-full border border-[color:var(--admin-primary-soft-border)] bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary-soft-foreground)] shadow-none">
                            {item.assistanceType}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--admin-subtle)]">
                          {formatBansosPeriod(item)} • {item.fundingSource}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
                          Dibuat {new Date(item.createdAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] px-4 py-3 text-sm text-[color:var(--admin-body)]">
                      <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-subtle)]">RT Cakupan</p>
                      <p className="mt-1 font-semibold">{item.allowedRtScope.map((rt) => `RT ${rt}`).join(', ')}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-subtle)]">Persyaratan Umum</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.generalRequirements.map((requirement) => (
                        <Badge
                          key={requirement}
                          className="rounded-full border border-[color:var(--admin-success-border)] bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success-foreground)] shadow-none"
                        >
                          {requirementLabelMap[requirement] ?? requirement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-[color:var(--admin-heading)]">Pengajuan Bansos Warga</h2>
              <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">Approve atau tolak pengajuan bansos langsung dari daftar program bansos.</p>
            </div>

            {applications.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--admin-surface-soft)]">
                  <CheckCircle2 className="h-6 w-6 text-[color:var(--admin-muted)]" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[color:var(--admin-heading)]">Tidak ada pengajuan bansos</h3>
                <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">Semua pengajuan bansos sudah ditinjau atau belum ada yang masuk.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {applications.map((application) => (
                  <Card key={application.id} className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success-foreground)]">
                          <HandCoins className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-[color:var(--admin-heading)]">{application.payload.applicantName}</h3>
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">Menunggu</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[color:var(--admin-primary)]">{application.payload.title}</p>
                          <div className="mt-3 flex flex-col gap-1 text-sm text-[color:var(--admin-subtle)] sm:flex-row sm:items-center sm:gap-4">
                            <p>
                              Ref ID: <span className="font-semibold text-[color:var(--admin-heading)]">{application.id}</span>
                            </p>
                            <span className="hidden sm:inline">•</span>
                            <p>
                              Tanggal: <span className="font-semibold text-[color:var(--admin-heading)]">{new Date(application.createdAt).toLocaleDateString('id-ID')}</span>
                            </p>
                          </div>
                          <p className="mt-2 text-sm text-[color:var(--admin-subtle)]">
                            {application.payload.assistanceType} • RT {application.payload.applicantRt} / RW {application.payload.applicantRw} • {formatBansosPeriod(application.payload)}
                          </p>
                          <p className="mt-1 text-sm font-medium text-[color:var(--admin-heading)]">Gaji: {application.payload.incomeAmount}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          onClick={() => setViewedApplication(application)}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setRejectingApplication(application);
                            setRejectReason('');
                          }}
                          className="rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Tolak
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void handleApproveApplication(application.id)}
                          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Setujui
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={!!viewedApplication} onOpenChange={(open) => !open && setViewedApplication(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Detail Pengajuan Bansos</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Informasi lengkap warga dan program bansos yang diajukan.
            </DialogDescription>
          </DialogHeader>
          {viewedApplication ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="font-bold text-[#1E293B]">{viewedApplication.payload.applicantName}</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600">{viewedApplication.payload.title}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Identitas Warga</p>
                <p className="mt-1 text-sm text-[#1E293B]">NIK {viewedApplication.payload.applicantNik}</p>
                <p className="mt-1 text-sm text-[#1E293B]">RT {viewedApplication.payload.applicantRt} / RW {viewedApplication.payload.applicantRw}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Program</p>
                <p className="mt-1 text-sm font-medium text-[#1E293B]">{viewedApplication.payload.assistanceType}</p>
                <p className="mt-1 text-sm text-[#64748B]">Periode {formatBansosPeriod(viewedApplication.payload)}</p>
                <p className="mt-1 text-sm text-[#64748B]">Dana {viewedApplication.payload.fundingSource}</p>
                <p className="mt-1 text-sm text-[#64748B]">Gaji {viewedApplication.payload.incomeAmount}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Catatan Warga</p>
                <p className="mt-1 text-sm text-[#1E293B]">{viewedApplication.payload.notes ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Lampiran</p>
                <div className="mt-3 flex flex-col gap-2">
                  {viewedApplication.payload.attachments.map((attachment, index) => (
                    <a
                      key={`${attachment.originalFilename}-${index}`}
                      href={attachment.url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm font-medium text-[#1E293B] transition hover:bg-gray-100"
                    >
                      {attachment.label} - {attachment.originalFilename}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectingApplication} onOpenChange={(open) => !open && setRejectingApplication(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Tolak Pengajuan Bansos</DialogTitle>
            <DialogDescription className="text-sm text-[#64748B]">
              Masukkan alasan penolakan agar warga menerima status yang jelas.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-4">
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              placeholder="Contoh: Dokumen penghasilan belum sesuai."
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setRejectingApplication(null)}>
                Batal
              </Button>
              <Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={() => void handleRejectApplication()}>
                Tolak Pengajuan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
