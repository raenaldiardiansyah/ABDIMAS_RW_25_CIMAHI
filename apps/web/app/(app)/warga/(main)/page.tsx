'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Gift,
  LockKeyhole,
  Megaphone,
  ShieldCheck,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { PlatformApiError, platformFetch } from '@/lib/api/platform';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

import { useTheme } from '@/app/(app)/warga/_components/theme-context';
import { useIdentity } from '@/app/(app)/warga/_components/identity-context';
import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';

import PageHeader from '@/components/ui/page-header';
import FeatureCard from '@/components/warga/FeatureCard';
import SlideUpSheet from '@/components/warga/SlideUpSheet';
import StatusPopup from '@/components/warga/StatusPopup';
import FormInput from '@/components/warga/FormInput';
import FormDatePicker from '@/components/warga/FormDatePicker';
import FormCheckbox from '@/components/warga/FormCheckbox';
import FormTextarea from '@/components/warga/FormTextarea';
import FormFileUpload from '@/components/warga/FormFileUpload';
import CommentCarousel from '@/components/warga/CommentCarousel';
import QuickActionsPanel from '@/components/warga/QuickActionsPanel';

import {
  BANSOS_AKTIF,
  BANSOS_DIVERIFIKASI,
  BANSOS_TIDAK_LAYAK,
  PEMILU_TERDAFTAR,
  PEMILU_TIDAK_TERDAFTAR,
} from '@/constants/mockData';

import type {
  BansosResult,
  PemiluResult,
  StatusBansos,
  StatusPemilu,
} from '@/types/warga';

type ActiveSheet = 'bansos' | 'pemilu' | 'aspirasi' | null;

type PopupState = {
  variant: 'success' | 'warning' | 'error';
  judul: string;
} | null;

const BANSOS_PROGRAMS = [
  {
    id: 'PKH',
    name: 'Program Keluarga Harapan',
    desc: 'PKH · Bantuan tunai bersyarat',
  },
  {
    id: 'BPNT',
    name: 'Bantuan Pangan Non-Tunai',
    desc: 'BPNT · Sembako & kebutuhan pokok',
  },
  {
    id: 'BST',
    name: 'Bantuan Sosial Tunai',
    desc: 'BST · Bantuan langsung tunai',
  },
];

export default function WargaHomePage() {
  const { isDark, toggleDark } = useTheme();
  const identity = useIdentity();

  const isRestricted = identity.verificationStatus !== 'VERIFIED';

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [popup, setPopup] = useState<PopupState>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const [bansosNik, setBansosNik] = useState('');
  const [bansosNama, setBansosNama] = useState('');
  const [bansosProgram, setBansosProgram] = useState('');
  const [bansosResult, setBansosResult] = useState<BansosResult | null>(null);

  const [pemiluNik, setPemiluNik] = useState('');
  const [pemiluTgl, setPemiluTgl] = useState('');
  const [pemiluResult, setPemiluResult] = useState<PemiluResult | null>(null);

  const [aspirasiJenis, setAspirasiJenis] = useState<string[]>([]);
  const [aspirasiUraian, setAspirasiUraian] = useState('');
  const [aspirasiFile, setAspirasiFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<null | 'bansos' | 'pemilu' | 'aspirasi'>(null);

  const handleBansosSubmit = async () => {
    setSubmitting('bansos');
    try {
      setBlockedMessage(null);
      const { data } = await platformFetch<{
        eligible: boolean;
        message: string;
        checkedAt: string;
      }>('/services/bansos/check', {
        method: 'POST',
        body: JSON.stringify({ nik: bansosNik }),
      });

      const result: BansosResult = data.eligible
        ? {
            ...BANSOS_AKTIF,
            nama: bansosNama,
            nik: bansosNik,
            program: (bansosProgram || 'PKH') as BansosResult['program'],
            keterangan: data.message,
          }
        : {
            ...BANSOS_TIDAK_LAYAK,
            nama: bansosNama,
            nik: bansosNik,
            program: (bansosProgram || 'Bantuan Tunai') as BansosResult['program'],
            keterangan: data.message,
          };

      setBansosResult(result);
      setActiveSheet(null);
      setPopup({
        variant: data.eligible ? 'success' : 'error',
        judul: data.eligible ? 'Anda Layak Menerima Bansos' : 'Tidak Memenuhi Kriteria',
      });
    } catch (error) {
      if (error instanceof PlatformApiError && error.code === 'VERIFICATION_REQUIRED') {
        setBlockedMessage(
          error.verificationStatus === 'REJECTED' && error.rejectionReason
            ? `Verifikasi ditolak: ${error.rejectionReason}`
            : 'Fitur ini menunggu verifikasi admin RW/RT.',
        );
      } else {
        setBlockedMessage(error instanceof Error ? error.message : 'Gagal memeriksa status bansos.');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handlePemiluSubmit = async () => {
    setSubmitting('pemilu');
    try {
      setBlockedMessage(null);
      const { data } = await platformFetch<{
        registered: boolean;
        tps?: string;
        message: string;
        checkedAt: string;
      }>('/services/pemilu/check', {
        method: 'POST',
        body: JSON.stringify({ nik: pemiluNik }),
      });

      const result: PemiluResult = data.registered
        ? {
            ...PEMILU_TERDAFTAR,
            nik: pemiluNik,
            tps: data.tps || PEMILU_TERDAFTAR.tps,
            keterangan: data.message,
          }
        : {
            ...PEMILU_TIDAK_TERDAFTAR,
            nik: pemiluNik,
            keterangan: data.message,
          };

      setPemiluResult(result);
      setActiveSheet(null);
      setPopup({
        variant: data.registered ? 'success' : 'error',
        judul: data.registered ? 'Terdaftar Sebagai Pemilih' : 'Belum Terdaftar di DPT',
      });
    } catch (error) {
      if (error instanceof PlatformApiError && error.code === 'VERIFICATION_REQUIRED') {
        setBlockedMessage(
          error.verificationStatus === 'REJECTED' && error.rejectionReason
            ? `Verifikasi ditolak: ${error.rejectionReason}`
            : 'Fitur ini menunggu verifikasi admin RW/RT.',
        );
      } else {
        setBlockedMessage(error instanceof Error ? error.message : 'Gagal memeriksa status pemilu.');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleAspirasiSubmit = async () => {
    setSubmitting('aspirasi');
    try {
      setBlockedMessage(null);
      await platformFetch('/aspirations', {
        method: 'POST',
        body: JSON.stringify({
          title: `Aspirasi - ${aspirasiJenis[0] || 'masukan'}`,
          message: aspirasiUraian,
          category: aspirasiJenis[0] || 'masukan',
        }),
      });

      setActiveSheet(null);
      setPopup({
        variant: 'success',
        judul: 'Laporan Berhasil Dikirim',
      });
    } catch (error) {
      if (error instanceof PlatformApiError && error.code === 'VERIFICATION_REQUIRED') {
        setBlockedMessage(
          error.verificationStatus === 'REJECTED' && error.rejectionReason
            ? `Verifikasi ditolak: ${error.rejectionReason}`
            : 'Fitur ini menunggu verifikasi admin RW/RT.',
        );
      } else {
        setBlockedMessage(error instanceof Error ? error.message : 'Gagal mengirim aspirasi.');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const closeSheet = () => setActiveSheet(null);

  const closePopup = () => {
    setPopup(null);
    setBansosResult(null);
    setPemiluResult(null);
  };

  const isBansosSubmitDisabled =
    bansosNik.length !== 16 || !bansosNama.trim() || !bansosProgram;
  const isPemiluSubmitDisabled = pemiluNik.length !== 16 || !pemiluTgl;

  return (
    <WargaPage>
      <PageHeader
        title="Beranda Warga"
        variant="brand"
        className="pb-7"
        rightSlot={
          <>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15"
            >
              <Link href="/warga/settings" aria-label="Pengaturan">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleDark}
              className="h-10 w-10 rounded-xl border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15"
              aria-label="Ubah tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </>
        }
        bottomSlot={
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/14 text-xl font-bold shadow-lg">
              {(identity.userName?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold leading-tight">{identity.userName}</p>
              <p className="mt-1 truncate font-mono text-xs text-primary-foreground/70">{identity.maskedNik}</p>
              {identity.verificationStatus === 'VERIFIED' && (
                <Badge
                  variant="secondary"
                  className="mt-2 w-fit gap-1.5 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-none"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Terverifikasi
                </Badge>
              )}
              {identity.verificationStatus === 'PENDING' && (
                <Badge
                  variant="secondary"
                  className="mt-2 w-fit rounded-full border border-[color:var(--status-warning)]/40 bg-[color:var(--status-warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-none"
                >
                  Menunggu Verifikasi
                </Badge>
              )}
              {identity.verificationStatus === 'REJECTED' && (
                <Badge
                  variant="secondary"
                  className="mt-2 w-fit rounded-full border border-[color:var(--status-error)]/40 bg-[color:var(--status-error)]/20 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-none"
                >
                  Verifikasi Ditolak
                </Badge>
              )}
            </div>
          </div>
        }
      />

      <WargaPageBody className="flex flex-col gap-3">
        {isRestricted && (
          <Alert className="relative overflow-hidden rounded-3xl border border-[color:var(--accent-amber)]/25 bg-[color:var(--accent-amber)]/10 p-4 shadow-sm">
            <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-[color:var(--accent-amber)]/20 blur-2xl" />

            <div className="relative flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-(--accent-amber)/25 bg-(--accent-amber)/15">
                <AlertCircle className="size-5 text-(--accent-amber)" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <AlertTitle className="text-sm font-bold tracking-tight text-foreground">
                    Akses terbatas
                  </AlertTitle>

                  <span className="shrink-0 rounded-full bg-(--accent-amber)/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-(--accent-amber)">
                    {identity.verificationStatus}
                  </span>
                </div>

                <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
                  {identity.verificationStatus === 'REJECTED'
                    ? `Verifikasi ditolak. ${identity.rejectionReason ? `Alasan: ${identity.rejectionReason}` : 'Hubungi admin RW/RT.'}`
                    : 'Akun Anda belum diverifikasi RW/RT. Sebagian fitur masih dikunci sampai proses verifikasi selesai.'}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {blockedMessage && (
          <Alert className="rounded-3xl border border-[color:var(--status-error)]/20 bg-[color:var(--status-error)]/8 p-4 shadow-sm">
            <AlertDescription className="text-xs font-medium text-foreground">{blockedMessage}</AlertDescription>
          </Alert>
        )}

        <QuickActionsPanel isRestricted={isRestricted} />

        {isRestricted ? (
          <VerificationRequiredCard rejectionReason={identity.rejectionReason} />
        ) : (
          <>
            <FeatureCard
              icon={Gift}
              judul="Cek Status Bansos"
              deskripsi="Verifikasi kelayakan dan status bantuan sosial Anda berdasarkan data DTKS."
              badge="Bantuan Sosial"
              variant="large"
              tone="primary"
              onClick={() => setActiveSheet('bansos')}
              delay={50}
            />

            <div className="grid grid-cols-2 gap-3">
              <FeatureCard
                icon={ShieldCheck}
                judul="Cek DPT/TPS"
                deskripsi="Periksa status pemilih Anda di DPT."
                badge="Pemilu"
                variant="compact"
                tone="sky"
                onClick={() => setActiveSheet('pemilu')}
                delay={100}
              />

              <FeatureCard
                icon={Megaphone}
                judul="Aspirasi"
                deskripsi="Kirim masukan atau keluhan Anda."
                badge="Laporan"
                variant="compact"
                tone="violet"
                onClick={() => setActiveSheet('aspirasi')}
                delay={150}
              />
            </div>
          </>
        )}

        <CommentCarousel />
      </WargaPageBody>

      <SlideUpSheet
        isOpen={activeSheet === 'bansos'}
        onClose={closeSheet}
        title="Cek Status Bansos"
        deskripsi="Masukkan data Anda untuk memeriksa kelayakan penerima bantuan sosial."
      >
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="bansos-nik">NIK (16 Digit)</Label>
            <Input
              id="bansos-nik"
              type="text"
              placeholder="Masukkan NIK Anda"
              maxLength={16}
              inputMode="numeric"
              value={bansosNik}
              onChange={(e) =>
                setBansosNik(e.target.value.replace(/\D/g, '').slice(0, 16))
              }
              className="h-12 rounded-xl bg-background"
            />
            <p className="text-[11px] text-muted-foreground">
              Nomor Induk Kependudukan sesuai KTP.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bansos-nama">Nama Lengkap</Label>
            <Input
              id="bansos-nama"
              type="text"
              placeholder="Sesuai KTP"
              value={bansosNama}
              onChange={(e) => setBansosNama(e.target.value)}
              className="h-12 rounded-xl bg-background"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Jenis Program Bansos</Label>

            <RadioGroup
              value={bansosProgram}
              onValueChange={setBansosProgram}
              className="grid gap-2"
            >
              {BANSOS_PROGRAMS.map((program) => {
                const isSelected = bansosProgram === program.name;

                return (
                  <Label
                    key={program.id}
                    htmlFor={program.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors',
                      isSelected
                        ? 'border-primary/30 bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:bg-muted/60'
                    )}
                  >
                    <RadioGroupItem
                      id={program.id}
                      value={program.name}
                      className={cn(
                        isSelected ? 'border-primary-foreground/60 text-primary-foreground' : undefined,
                      )}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        )}
                      >
                        {program.name}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-xs',
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}
                      >
                        {program.desc}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          <Button
            onClick={handleBansosSubmit}
            disabled={isBansosSubmitDisabled || submitting === 'bansos'}
            className="h-12 rounded-xl font-semibold"
          >
            {submitting === 'bansos' ? 'Memproses...' : 'Konfirmasi'}
          </Button>
        </div>
      </SlideUpSheet>

      <SlideUpSheet
        isOpen={activeSheet === 'pemilu'}
        onClose={closeSheet}
        title="Cek Status Pemilih"
        deskripsi="Periksa apakah Anda sudah terdaftar di Daftar Pemilih Tetap (DPT)."
      >
        <div className="flex flex-col gap-4">
          <FormInput
            label="NIK (16 Digit)"
            placeholder="Masukkan NIK Anda"
            value={pemiluNik}
            onChange={(e) =>
              setPemiluNik(e.target.value.replace(/\D/g, '').slice(0, 16))
            }
            maxLength={16}
            inputMode="numeric"
          />

          <FormDatePicker
            label="Tanggal Lahir"
            value={pemiluTgl}
            onChange={setPemiluTgl}
          />

          <Button
            onClick={handlePemiluSubmit}
            disabled={isPemiluSubmitDisabled || submitting === 'pemilu'}
            className="mt-2 h-12 rounded-xl font-semibold"
          >
            {submitting === 'pemilu' ? 'Memproses...' : 'Konfirmasi'}
          </Button>
        </div>
      </SlideUpSheet>

      <SlideUpSheet
        isOpen={activeSheet === 'aspirasi'}
        onClose={closeSheet}
        title="Sampaikan Aspirasi"
        deskripsi="Kirimkan masukan atau keluhan Anda untuk perbaikan lingkungan."
      >
        <div className="flex flex-col gap-4">
          <FormCheckbox
            label="Jenis Laporan"
            options={[
              { value: 'masukan', label: 'Masukan' },
              { value: 'keluhan', label: 'Keluhan' },
            ]}
            selected={aspirasiJenis}
            onChange={setAspirasiJenis}
            singleSelect
          />

          <FormTextarea
            label="Uraian"
            value={aspirasiUraian}
            onChange={setAspirasiUraian}
            placeholder="Jelaskan masukan atau keluhan Anda secara detail..."
            maxLength={500}
          />

          <FormFileUpload
            label="Lampiran Bukti (Opsional)"
            file={aspirasiFile}
            onChange={setAspirasiFile}
          />

          <Button
            onClick={handleAspirasiSubmit}
            disabled={aspirasiJenis.length === 0 || !aspirasiUraian.trim() || submitting === 'aspirasi'}
            className="mt-2 h-12 rounded-xl font-semibold"
          >
            {submitting === 'aspirasi' ? 'Mengirim...' : 'Konfirmasi'}
          </Button>
        </div>
      </SlideUpSheet>

      {popup && bansosResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant={popup.variant}
          judul={popup.judul}
          actions={
            <>
              <Button asChild className="h-12 w-full rounded-xl font-semibold">
                <Link href="/warga/history">Lihat Selengkapnya</Link>
              </Button>

              <Button
                variant="ghost"
                onClick={closePopup}
                className="h-12 w-full rounded-xl font-semibold text-muted-foreground"
              >
                Tutup
              </Button>
            </>
          }
        >
          <div className="mb-1 mt-2 text-left">
            {bansosResult.status === 'aktif' && (
              <div className="flex flex-col gap-0.5 text-sm">
                <InfoRow label="Nama Penerima" value={bansosResult.nama} />
                <InfoRow label="Program" value={bansosResult.program} />
                <InfoRow label="DTKS Tahun" value={bansosResult.dtks || '-'} />
                <InfoRow label="Status" value="Aktif" />
              </div>
            )}

            {bansosResult.status === 'diverifikasi' && (
              <p className="text-center text-muted-foreground">
                {bansosResult.keterangan}
              </p>
            )}

            {bansosResult.status === 'tidak_layak' && (
              <p className="text-center text-muted-foreground">
                {bansosResult.keterangan}
              </p>
            )}
          </div>
        </StatusPopup>
      )}

      {popup && pemiluResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant={popup.variant}
          judul={popup.judul}
          actions={
            <>
              <Button asChild className="h-12 w-full rounded-xl font-semibold">
                <Link href="/warga/history">Lihat Selengkapnya</Link>
              </Button>

              <Button
                variant="ghost"
                onClick={closePopup}
                className="h-12 w-full rounded-xl font-semibold text-muted-foreground"
              >
                Tutup
              </Button>
            </>
          }
        >
          <div className="mb-1 mt-2 text-left">
            {pemiluResult.status === 'terdaftar' && (
              <div className="flex flex-col gap-0.5 text-sm">
                <InfoRow label="Nama" value={pemiluResult.nama || '-'} />
                <InfoRow
                  label="DPT Tahun"
                  value={pemiluResult.dptTahun || '-'}
                />
                <InfoRow label="NIK" value={pemiluResult.nik || '-'} />
                <InfoRow
                  label="Jenis Kelamin"
                  value={
                    pemiluResult.jenisKelamin === 'L'
                      ? 'Laki-laki'
                      : 'Perempuan'
                  }
                />
                <InfoRow
                  label="No. Urut DPT"
                  value={pemiluResult.noUrut || '-'}
                />
                <InfoRow label="Lokasi TPS" value={pemiluResult.tps || '-'} />
                <InfoRow label="Status" value="Aktif" />
              </div>
            )}

            {pemiluResult.status === 'tidak_terdaftar' && (
              <p className="text-center text-muted-foreground">
                {pemiluResult.keterangan}
              </p>
            )}
          </div>
        </StatusPopup>
      )}

      {popup && !bansosResult && !pemiluResult && (
        <StatusPopup
          isOpen
          onClose={closePopup}
          variant="success"
          judul="Laporan Berhasil Dikirim"
          actions={
            <>
              <Button asChild className="h-12 w-full rounded-xl font-semibold">
                <Link href="/warga/history">Lihat Selengkapnya</Link>
              </Button>

              <Button
                variant="ghost"
                onClick={closePopup}
                className="h-12 w-full rounded-xl font-semibold text-muted-foreground"
              >
                Tutup
              </Button>
            </>
          }
        >
          <div className="mb-1 mt-2 text-left">
            <div className="flex flex-col gap-0.5 text-sm">
              <InfoRow
                label="Jenis Laporan"
                value={aspirasiJenis.join(', ') || '-'}
              />
              <InfoRow label="Pelapor" value={identity.userName} />
              <InfoRow
                label="Tanggal"
                value={new Date().toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              />
            </div>
          </div>
        </StatusPopup>
      )}
    </WargaPage>
  );
}

function VerificationRequiredCard({ rejectionReason }: { rejectionReason?: string | null }) {
  return (
    <Card className="overflow-hidden rounded-3xl bg-card shadow-sm">
      <CardContent className="flex flex-col items-center px-6 pt-6 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole className="size-7" />
        </div>

        <Badge variant="secondary" className="mb-3 rounded-full">
          Butuh Verifikasi
        </Badge>

        <h3 className="text-base font-bold text-foreground">
          Verifikasi dibutuhkan
        </h3>

        <p className="mt-2 max-w-70 text-sm leading-relaxed text-muted-foreground">
          Setelah akun diverifikasi oleh RW/RT, Anda bisa cek bansos, DPT/TPS,
          dan mengirim aspirasi langsung dari aplikasi.
        </p>

        {rejectionReason ? (
          <div className="mt-4 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">Alasan penolakan</p>
            <p className="mt-1 text-sm text-red-700">{rejectionReason}</p>
          </div>
        ) : null}

        <div className="mt-6 grid w-full gap-2 text-left">
          <VerificationStep checked label="Data warga sudah dikirim" />
          <VerificationStep label="Menunggu validasi admin RW/RT" />
          <VerificationStep label="Akses fitur akan dibuka otomatis" />
        </div>
      </CardContent>
    </Card>
  );
}

function VerificationStep({
  label,
  checked,
}: {
  label: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full',
          checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {checked ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <LockKeyhole className="size-3.5" />
        )}
      </div>

      <p className="text-xs font-medium text-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}
