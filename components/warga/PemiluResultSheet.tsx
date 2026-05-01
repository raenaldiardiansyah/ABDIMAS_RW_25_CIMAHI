'use client';

import { useEffect } from 'react';
import {
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PemiluResult, StatusPemilu } from '@/types/warga';

interface PemiluResultSheetProps {
  isOpen: boolean;
  onClose: () => void;
  result: PemiluResult;
}

const STATUS_CONFIG: Record<
  StatusPemilu,
  {
    label: string;
    dotColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  terdaftar: {
    label: 'Layak Pemilu',
    dotColor: 'bg-[color:var(--accent-mint)]',
    badgeBg: 'bg-[color:var(--accent-mint)]/18',
    badgeText: 'text-[color:var(--accent-mint)]',
  },
  tidak_terdaftar: {
    label: 'Tidak Layak',
    dotColor: 'bg-[color:var(--accent-coral)]',
    badgeBg: 'bg-[color:var(--accent-coral)]/18',
    badgeText: 'text-[color:var(--accent-coral)]',
  },
};

/* ═══════════════════════════════════════════════════════════════ */

export default function PemiluResultSheet({
  isOpen,
  onClose,
  result,
}: PemiluResultSheetProps) {
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
                {result.status === 'terdaftar' ? 'ANDA BERHAK MEMILIH' : 'ANDA TIDAK TERDAFTAR'}
              </h3>
              <p className="text-[13px] text-primary-foreground/80">Cek DPT Pemilu 2026</p>
              <p className="text-[11px] text-primary-foreground/70 mt-1">Pembaruan terakhir: {today}</p>
            </div>
          </div>

          {/* ═══ STATUS-SPECIFIC CONTENT ═══ */}
          {result.status === 'terdaftar' && (
            <TerdaftarContent result={result} />
          )}
          {result.status === 'tidak_terdaftar' && (
            <TidakTerdaftarContent result={result} />
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

/* ═══ TERDAFTAR ════════════════════════════════════════════════════ */

function TerdaftarContent({
  result,
}: {
  result: PemiluResult;
}) {
  return (
    <div className="px-4 py-4 flex flex-col gap-2">
      {/* White info card */}
      <div className="bg-background rounded-2xl border border-input shadow-sm p-4">
        <InfoRow label="Nama Pemilih" value={result.nama || '-'} bold />
        <InfoRow label="NIK" value={result.nik || '-'} mono />
      </div>

      {/* Brown detail card */}
      <div className="bg-primary rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-foreground/70" />
          Detail DPT
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <DetailItem label="Nama Lengkap" value={result.nama || '-'} />
          <DetailItem label="NIK" value={result.nik || '-'} />
          <DetailItem label="DPT Tahun" value={result.dptTahun || '-'} />
          <DetailItem label="Jenis Kelamin" value={result.jenisKelamin === 'L' ? 'Laki-laki' : result.jenisKelamin === 'P' ? 'Perempuan' : '-'} />
          <DetailItem label="No. Urut DPT" value={result.noUrut || '-'} />
          <DetailItem label="Lokasi TPS" value={result.tps || '-'} />
          <DetailItem label="Status" value="Terdaftar" highlight />
          <DetailItem label="Sumber Data" value="KPU / Operator Desa" />
        </div>
      </div>

      {/* Green keterangan */}
      <div className="bg-[color:var(--accent-mint)]/10 rounded-xl p-4 border border-[color:var(--accent-mint)]/25">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-[color:var(--accent-mint)] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[color:var(--accent-mint)] leading-relaxed">
            Anda telah terdaftar sebagai pemilih pada Pemilu 2026. Silakan datang ke TPS yang tertera pada hari pemilihan.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══ TIDAK TERDAFTAR ══════════════════════════════════════════════ */

function TidakTerdaftarContent({ result }: { result: PemiluResult }) {
  return (
    <div className="px-4 py-4 flex flex-col gap-2">
      {/* White data card */}
      <div className="bg-background rounded-2xl border border-input shadow-sm p-4">
        <InfoRow label="Nama Pemilih" value={result.nama || '-'} bold />
        <InfoRow label="NIK" value={result.nik || '-'} mono />
      </div>

      {/* Brown data card */}
      <div className="bg-primary rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-foreground/70" />
          Data Pemilih
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <DetailItem label="Nama Lengkap" value={result.nama || '-'} />
          <DetailItem label="NIK" value={result.nik || '-'} />
          <DetailItem label="Status" value="Tidak Terdaftar" />
          <DetailItem label="Sumber Data" value="KPU / Operator Desa" />
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
              {result.keterangan || 'NIK tidak ditemukan di DPT. Data DPT diperbarui per Maret 2026.'}
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[color:var(--accent-amber)] mt-1.5 shrink-0" />
            <p className="text-[12px] text-primary-foreground/80 leading-relaxed">
              Jika Anda merasa sudah mendaftar, cek kembali atau hubungi KPU/Kelurahan setempat.
            </p>
          </div>
        </div>
      </div>

      {/* Red warning */}
      <div className="bg-[color:var(--accent-coral)]/10 rounded-xl p-4 border border-[color:var(--accent-coral)]/25">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 text-[color:var(--accent-coral)] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[color:var(--accent-coral)] leading-relaxed">
            Anda tidak terdaftar sebagai pemilih. Anda tidak dapat mengikuti pemilihan kecuali jika masalah ini diselesaikan dengan pihak berwenang.
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
