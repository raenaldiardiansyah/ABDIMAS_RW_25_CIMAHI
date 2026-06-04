'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, FileText, RefreshCw } from 'lucide-react';

import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';
import { useAutoRefresh } from '@/lib/use-auto-refresh';
import { useIdentity } from '@/app/(app)/warga/_components/identity-context';
import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type RequestType = 'HOUSEHOLD_CREATE' | 'MUTATION_IN' | 'MUTATION_OUT' | 'BANSOS_APPLICATION';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type RequestItem = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  payload: Record<string, unknown>;
  rejectionReason: string | null;
  createdAt: string;
};

type MutationForm = {
  type: 'MUTATION_IN' | 'MUTATION_OUT';
  mutationDate: string;
  fromAddress: string;
  toAddress: string;
  targetRt: string;
  phone: string;
  reason: string;
};

function requestTypeLabel(type: RequestType) {
  if (type === 'HOUSEHOLD_CREATE') return 'Pembuatan Kartu Keluarga';
  if (type === 'MUTATION_IN') return 'Mutasi Masuk';
  if (type === 'BANSOS_APPLICATION') return 'Permohonan Bansos';
  return 'Mutasi Keluar';
}

function statusLabel(status: RequestStatus) {
  if (status === 'APPROVED') return 'Disetujui';
  if (status === 'REJECTED') return 'Ditolak';
  return 'Menunggu';
}

function statusClass(status: RequestStatus) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

function requestSummary(item: RequestItem) {
  if (item.type === 'HOUSEHOLD_CREATE') {
    const household = item.payload.household as Record<string, unknown> | undefined;
    return household?.address ? String(household.address) : 'Permohonan pembuatan kartu keluarga baru.';
  }

  if (item.type === 'BANSOS_APPLICATION') {
    return typeof item.payload.title === 'string'
      ? `Pengajuan bansos ${item.payload.title}`
      : 'Permohonan bansos warga.';
  }

  const address =
    typeof item.payload.toAddress === 'string'
      ? item.payload.toAddress
      : typeof item.payload.fromAddress === 'string'
        ? item.payload.fromAddress
        : null;

  return address || (typeof item.payload.reason === 'string' ? item.payload.reason : 'Permohonan mutasi warga.');
}

export default function WargaLayananPage() {
  const identity = useIdentity();
  const isRestricted = identity.verificationStatus !== 'VERIFIED';

  const [mode, setMode] = useState<RequestType>('HOUSEHOLD_CREATE');
  const [items, setItems] = useState<RequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [kkNumber, setKkNumber] = useState('');
  const [address, setAddress] = useState('');
  const [rt, setRt] = useState('');
  const [rw, setRw] = useState('');
  const [mutationForm, setMutationForm] = useState<MutationForm>({
    type: 'MUTATION_IN',
    mutationDate: '',
    fromAddress: '',
    toAddress: '',
    targetRt: '',
    phone: '',
    reason: '',
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await platformFetch<RequestItem[]>('/requests?page=1&limit=50');
      setItems(response.data);
    } catch (err) {
      setError(getPlatformErrorMessage(err, 'Gagal memuat permohonan.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useAutoRefresh(() => load(), {
    intervalMs: 10000,
  });

  const filteredItems = useMemo(() => {
    if (statusFilter === 'ALL') return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  async function submitHouseholdRequest() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await platformFetch('/requests/household-create', {
        method: 'POST',
        body: JSON.stringify({ kkNumber, address, rt, rw }),
      });
      setSuccess('Permohonan kartu keluarga berhasil dikirim.');
      setKkNumber('');
      setAddress('');
      setRt('');
      setRw('');
      await load();
    } catch (err) {
      setError(getPlatformErrorMessage(err, 'Gagal mengirim permohonan.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitMutationRequest() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await platformFetch('/requests/mutation', {
        method: 'POST',
        body: JSON.stringify(mutationForm),
      });
      setSuccess('Permohonan mutasi berhasil dikirim.');
      setMutationForm({
        type: mutationForm.type,
        mutationDate: '',
        fromAddress: '',
        toAddress: '',
        targetRt: '',
        phone: '',
        reason: '',
      });
      await load();
    } catch (err) {
      setError(getPlatformErrorMessage(err, 'Gagal mengirim permohonan mutasi.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WargaPage>
      <PageHeader
        title="Layanan RT"
        eyebrow="Portal RW 25 Cimahi"
        description="Ajukan permohonan dan pantau status review admin."
        variant="brand"
        className="pb-7"
        titleClassName="text-xl"
        rightSlot={
          <Button
            asChild
            variant="outline"
            size="icon"
            className="mt-1 rounded-2xl border border-white/20 bg-white/10 text-primary-foreground shadow-sm transition-colors hover:bg-white/15"
          >
            <Link href="/warga" aria-label="Kembali ke beranda">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <WargaPageBody className="flex flex-col gap-4">
        {isRestricted ? (
          <Card className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-700">Pengajuan baru terkunci</p>
                <p className="mt-1 text-sm text-amber-700">
                  Akun harus terverifikasi untuk membuat permohonan baru. Riwayat permohonan tetap bisa dilihat.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="rounded-3xl border border-input p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mode === 'HOUSEHOLD_CREATE' ? 'default' : 'outline'}
                className="rounded-2xl"
                onClick={() => setMode('HOUSEHOLD_CREATE')}
              >
                Kartu Keluarga
              </Button>
              <Button
                type="button"
                variant={mode === 'MUTATION_IN' ? 'default' : 'outline'}
                className="rounded-2xl"
                onClick={() => {
                  setMode('MUTATION_IN');
                  setMutationForm((prev) => ({ ...prev, type: 'MUTATION_IN' }));
                }}
              >
                Mutasi Masuk
              </Button>
              <Button
                type="button"
                variant={mode === 'MUTATION_OUT' ? 'default' : 'outline'}
                className="rounded-2xl"
                onClick={() => {
                  setMode('MUTATION_OUT');
                  setMutationForm((prev) => ({ ...prev, type: 'MUTATION_OUT' }));
                }}
              >
                Mutasi Keluar
              </Button>
            </div>

            {mode === 'HOUSEHOLD_CREATE' ? (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="kk-number">Nomor KK</Label>
                  <Input
                    id="kk-number"
                    value={kkNumber}
                    maxLength={16}
                    inputMode="numeric"
                    onChange={(e) => setKkNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="16 digit nomor KK"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kk-address">Alamat KK</Label>
                  <Textarea
                    id="kk-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat lengkap"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="kk-rt">RT</Label>
                    <Input id="kk-rt" value={rt} onChange={(e) => setRt(e.target.value.replace(/\D/g, '').slice(0, 3))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kk-rw">RW</Label>
                    <Input id="kk-rw" value={rw} onChange={(e) => setRw(e.target.value.replace(/\D/g, '').slice(0, 3))} />
                  </div>
                </div>
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={submitting || kkNumber.length !== 16 || address.trim().length < 5 || !rt || !rw}
                  onClick={() => void submitHouseholdRequest()}
                >
                  {submitting ? 'Mengirim...' : 'Kirim permohonan KK'}
                </Button>
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="mutation-date">Tanggal mutasi</Label>
                  <Input
                    id="mutation-date"
                    type="date"
                    value={mutationForm.mutationDate}
                    onChange={(e) => setMutationForm((prev) => ({ ...prev, mutationDate: e.target.value }))}
                  />
                </div>
                {mode === 'MUTATION_IN' ? (
                  <div className="grid gap-2">
                    <Label htmlFor="to-address">Alamat tujuan/domilisi</Label>
                    <Textarea
                      id="to-address"
                      value={mutationForm.toAddress}
                      onChange={(e) => setMutationForm((prev) => ({ ...prev, toAddress: e.target.value }))}
                      rows={3}
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="from-address">Alamat asal</Label>
                    <Textarea
                      id="from-address"
                      value={mutationForm.fromAddress}
                      onChange={(e) => setMutationForm((prev) => ({ ...prev, fromAddress: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="target-rt">RT tujuan</Label>
                    <Input
                      id="target-rt"
                      value={mutationForm.targetRt}
                      onChange={(e) =>
                        setMutationForm((prev) => ({
                          ...prev,
                          targetRt: e.target.value.replace(/\D/g, '').slice(0, 3),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mutation-phone">Nomor telepon</Label>
                    <Input
                      id="mutation-phone"
                      value={mutationForm.phone}
                      onChange={(e) => setMutationForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mutation-reason">Alasan</Label>
                  <Textarea
                    id="mutation-reason"
                    value={mutationForm.reason}
                    onChange={(e) => setMutationForm((prev) => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={
                    submitting ||
                    !mutationForm.mutationDate ||
                    !mutationForm.reason.trim() ||
                    (mode === 'MUTATION_IN' ? !mutationForm.toAddress.trim() : !mutationForm.fromAddress.trim())
                  }
                  onClick={() => void submitMutationRequest()}
                >
                  {submitting ? 'Mengirim...' : `Kirim ${mode === 'MUTATION_IN' ? 'mutasi masuk' : 'mutasi keluar'}`}
                </Button>
              </div>
            )}
          </Card>
        )}

        {error ? (
          <Card className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </Card>
        ) : null}

        {success ? (
          <Card className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
            className="rounded-2xl"
            onClick={() => setStatusFilter('ALL')}
          >
            Semua
          </Button>
          <Button
            type="button"
            variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
            className="rounded-2xl"
            onClick={() => setStatusFilter('PENDING')}
            >
            Menunggu
          </Button>
          <Button
            type="button"
            variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
            className="rounded-2xl"
            onClick={() => setStatusFilter('APPROVED')}
          >
            Disetujui
          </Button>
          <Button
            type="button"
            variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
            className="rounded-2xl"
            onClick={() => setStatusFilter('REJECTED')}
          >
            Ditolak
          </Button>
          <Button type="button" variant="outline" className="rounded-2xl" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Muat ulang
          </Button>
        </div>

        {loading ? (
          <Card className="rounded-3xl border border-input bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Memuat permohonan...
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="rounded-3xl border border-input bg-muted/30 p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Belum ada permohonan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permohonan yang Anda kirim akan langsung masuk ke inbox admin dan statusnya tampil di sini.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="rounded-3xl border border-input p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 text-primary shadow-none">
                        {requestTypeLabel(item.type)}
                      </Badge>
                      <Badge className={`rounded-full shadow-none ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-base font-bold text-foreground">
                      {requestTypeLabel(item.type)}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ref ID {item.id} • {new Date(item.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <Button asChild variant="outline" className="rounded-2xl">
                    <Link href="/warga/history">Lihat di riwayat</Link>
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                  {requestSummary(item)}
                </div>

                {typeof item.payload.reason === 'string' ? (
                  <div className="mt-3 rounded-2xl border border-input bg-background p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      Alasan Pengajuan
                    </p>
                    <p className="mt-2 text-sm text-foreground">{item.payload.reason}</p>
                  </div>
                ) : null}

                {item.rejectionReason ? (
                  <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-600">
                      Alasan Penolakan
                    </p>
                    <p className="mt-2 text-sm text-red-700">{item.rejectionReason}</p>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </WargaPageBody>
    </WargaPage>
  );
}
