'use client';

import { useEffect } from 'react';
import {
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Shield,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BansosResult, StatusBansos } from '@/types/warga';

interface BansosResultSheetProps {
  isOpen: boolean;
  onClose: () => void;
  result: BansosResult;
}

const STATUS_CONFIG: Record<
  StatusBansos,
  {
    label: string;
    dotColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  aktif: {
    label: 'Aktif',
    dotColor: 'bg-[color:var(--accent-mint)]',
    badgeBg: 'bg-[color:var(--accent-mint)]/18',
    badgeText: 'text-[color:var(--accent-mint)]',
  },
  diverifikasi: {
    label: 'Diverifikasi',
    dotColor: 'bg-[color:var(--accent-amber)]',
    badgeBg: 'bg-[color:var(--accent-amber)]/18',
    badgeText: 'text-[color:var(--accent-amber)]',
  },
  tidak_layak: {
    label: 'Tidak Layak',
    dotColor: 'bg-[color:var(--accent-coral)]',
    badgeBg: 'bg-[color:var(--accent-coral)]/18',
    badgeText: 'text-[color:var(--accent-coral)]',
  },
};

const PROGRAM_NAMES: Record<string, string> = {
  PKH: 'Program Keluarga Harapan',
  BPNT: 'Bantuan Pangan Non-Tunai',
  BST: 'Bantuan Sosial Tunai',
  'Bantuan Tunai': 'Bantuan Langsung Tunai',
  'BLT Dana Desa': 'Bantuan Langsung Tunai Dana Desa',
};

/* ═══════════════════════════════════════════════════════════════ */

export default function BansosResultSheet({
  isOpen,
  onClose,
  result,
}: BansosResultSheetProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = STATUS_CONFIG[result.status];
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const programFullName = PROGRAM_NAMES[result.program] || result.program;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-background rounded-t-[2rem] shadow-2xl animate-slide-up max-h-[92vh] overflow-hidden flex flex-col border border-input">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/35 rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-2">
          {/* ═══ MEGA MENDUNG HEADER ═══ */}
          <div
            className="relative mx-4 mt-1 rounded-2xl overflow-hidden bg-primary"
            style={{ minHeight: '140px' }}
          >
            {/* Pattern layer */}
            <div
              className="card-pattern-layer"
              style={{
                maskImage:
                  'radial-gradient(ellipse 140% 140% at 100% 0%, black 0%, black 35%, transparent 72%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 140% 140% at 100% 0%, black 0%, black 35%, transparent 72%)',
              }}
            />

            {/* Close chevron - top right */}
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-20 h-7 w-7 rounded-full bg-white/15 text-white/70 hover:bg-white/25 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>

            {/* Header content */}
            <div className="relative z-10 p-5 pt-4">
              {/* Top row: Date + Status Badge (pojok kanan) */}
              <div className="flex items-center gap-2 mb-4 pr-9">
                <span className="text-[12px] text-primary-foreground/70 font-medium">
                  {today}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.badgeBg} ${config.badgeText}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}
                  />
                  {config.label}
                </span>
              </div>

              {/* Divider */}
              <div className="w-full border-t border-white/10 mb-3" />

              {/* Title */}
              <h3 className="text-[17px] font-bold text-white mb-1">
                {result.status === 'aktif'
                  ? 'ANDA BERHAK MENERIMA BANSOS'
                  : result.status === 'tidak_layak'
                    ? 'ANDA TIDAK TERDAFTAR'
                    : 'DATA SEDANG DIPROSES'}
              </h3>
              <p className="text-[13px] text-primary-foreground/80">{programFullName}</p>
              <p className="text-[11px] text-primary-foreground/70 mt-1">Pembaruan terakhir: {today}</p>
            </div>
          </div>

          {/* ═══ STATUS-SPECIFIC CONTENT ═══ */}
          {result.status === 'aktif' && (
            <AktifContent result={result} today={today} />
          )}
          {result.status === 'tidak_layak' && (
            <TidakLayakContent result={result} />
          )}
          {result.status === 'diverifikasi' && (
            <DiverifikasiContent result={result} />
          )}
        </div>

        {/* ═══ BOTTOM ACTIONS ═══ */}
        <div className="px-4 pb-5 pt-4 flex justify-center text-center gap-2 border-t border-input bg-transparent">
          <Button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl text-[14px] font-bold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors block"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══ AKTIF ════════════════════════════════════════════════════ */

function AktifContent({
  result,
  today,
}: {
  result: BansosResult;
  today: string;
}) {
  return (
    <div className="px-4 py-4 flex flex-col gap-2">
      {/* White info card */}
      <div className="bg-background rounded-2xl border border-input shadow-sm p-4">
        <InfoRow label="Nama Penerima" value={result.nama} bold />
        <InfoRow label="NIK" value={result.nik} mono />
        <InfoRow label="Program" value={result.program} />
        <InfoRow label="DTKS Tahun" value={result.dtks || '-'} />
      </div>

      {/* Brown detail card */}
      <div className="bg-primary rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-foreground/70" />
          Detail Penerima
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <DetailItem label="Nama Lengkap" value={result.nama} />
          <DetailItem label="NIK" value={result.nik} />
          <DetailItem label="Program" value={result.program} />
          <DetailItem label="DTKS" value={result.dtks || '-'} />
          <DetailItem label="Tanggal Cek" value={today} />
          <DetailItem label="Status" value="Penerima Aktif" highlight />
          <DetailItem label="Sumber Data" value="DTKS Kemensos / Operator Desa" />
        </div>
      </div>

      {/* Green keterangan */}
      {result.keterangan && (
      <div className="bg-[color:var(--accent-mint)]/10 rounded-xl p-4 border border-[color:var(--accent-mint)]/25">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[color:var(--accent-mint)] mt-0.5 shrink-0" />
            <p className="text-[13px] text-[color:var(--accent-mint)] leading-relaxed">
              {result.keterangan}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ TIDAK LAYAK ══════════════════════════════════════════════ */

function TidakLayakContent({ result }: { result: BansosResult }) {
  return (
    <div className="px-4 py-4 flex flex-col gap-2">
      {/* Brown data card */}
      <div className="bg-primary rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-foreground/70" />
          Data Pemohon
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <DetailItem label="Nama Lengkap" value={result.nama} />
          <DetailItem label="NIK" value={result.nik} />
          <DetailItem label="Program" value={result.program} />
          <DetailItem label="Status" value="Tidak Layak" />
          <DetailItem label="Sumber Data" value="DTKS Kemensos / Operator Desa" />
        </div>
      </div>

      {/* Keterangan bullets */}
      <div className="bg-primary rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary-foreground/70" />
          Keterangan
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[color:var(--accent-coral)] mt-1.5 shrink-0" />
            <p className="text-[12px] text-primary-foreground/80 leading-relaxed">
              {result.keterangan}
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[color:var(--accent-amber)] mt-1.5 shrink-0" />
            <p className="text-[12px] text-primary-foreground/80 leading-relaxed">
              Jika kondisi berubah, silakan ajukan kembali melalui kelurahan
              setempat.
            </p>
          </div>
        </div>
      </div>

      {/* Red warning */}
      <div className="bg-[color:var(--accent-coral)]/10 rounded-xl p-4 border border-[color:var(--accent-coral)]/25">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 text-[color:var(--accent-coral)] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[color:var(--accent-coral)] leading-relaxed">
            Anda tidak memenuhi kriteria penerima bantuan sosial berdasarkan
            data DTKS terbaru.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══ DIVERIFIKASI ═════════════════════════════════════════════ */

function DiverifikasiContent({ result }: { result: BansosResult }) {
  return (
    <div className="px-4 py-4 flex flex-col gap-2">
      {/* White brief info */}
      <div className="bg-background rounded-2xl border border-input shadow-sm p-4">
        <InfoRow label="Nama" value={result.nama} bold />
        <InfoRow label="Program" value={result.program} />
        <InfoRow label="Status" value="Dalam Verifikasi" />
      </div>

      {/* Brown timeline card */}
      <div className="bg-primary rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-4 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-primary-foreground/70" />
          Progress Verifikasi
        </h4>
        <div className="space-y-4">
          <TimelineStep
            step={1}
            label="Pengajuan Diterima"
            desc="Data berhasil dikirim ke sistem"
            status="done"
          />
          <TimelineStep
            step={2}
            label="Verifikasi Dinas Sosial"
            desc="Sedang dalam peninjauan oleh petugas"
            status="current"
          />
          <TimelineStep
            step={3}
            label="Keputusan Final"
            desc="Menunggu hasil verifikasi"
            status="pending"
          />
        </div>
      </div>

      {/* Amber info */}
      <div className="bg-[color:var(--accent-amber)]/10 rounded-xl p-4 border border-[color:var(--accent-amber)]/25">
        <div className="flex items-start gap-1.5">
          <Clock className="w-4 h-4 text-[color:var(--accent-amber)] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[color:var(--accent-amber)] leading-relaxed">
            {result.keterangan}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══ SUB-COMPONENTS ═══════════════════════════════════════════ */

function InfoRow({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between py-2.5 border-b border-input last:border-0">
      <span className="text-[13px] text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-[13px] text-right ${bold ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'} ${mono ? 'font-mono tracking-wide' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-primary-foreground/70 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span
        className={`text-[13px] font-semibold ${highlight ? 'text-[color:var(--accent-mint)]' : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineStep({
  step,
  label,
  desc,
  status,
}: {
  step: number;
  label: string;
  desc: string;
  status: 'done' | 'current' | 'pending';
}) {
  const dotColor =
    status === 'done'
      ? 'bg-[color:var(--accent-mint)]'
      : status === 'current'
        ? 'bg-[color:var(--accent-amber)] animate-pulse'
        : 'bg-white/30';
  const lineColor = status === 'done' ? 'bg-[color:var(--accent-mint)]' : 'bg-white/30';
  const textColor = status === 'pending' ? 'text-white/60' : 'text-white';

  return (
    <div className="flex items-start gap-1.5">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dotColor} shrink-0`} />
        {step < 3 && <div className={`w-0.5 h-8 ${lineColor} mt-1`} />}
      </div>
      <div className="flex-1 -mt-0.5">
        <p className={`text-[13px] font-semibold ${textColor}`}>{label}</p>
        <p className="text-[11px] text-primary-foreground/70 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
