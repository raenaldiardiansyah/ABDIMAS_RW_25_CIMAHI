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
    dotColor: 'bg-emerald-400',
    badgeBg: 'bg-[#1a5c2a]',
    badgeText: 'text-[#8ed8a8]',
  },
  diverifikasi: {
    label: 'Diverifikasi',
    dotColor: 'bg-amber-400',
    badgeBg: 'bg-[#5c4510]',
    badgeText: 'text-[#f0d080]',
  },
  tidak_layak: {
    label: 'Tidak Layak',
    dotColor: 'bg-red-400',
    badgeBg: 'bg-[#6b1818]',
    badgeText: 'text-[#f0a0a0]',
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
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[2rem] shadow-2xl animate-slide-up max-h-[92vh] overflow-hidden flex flex-col">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-2">
          {/* ═══ MEGA MENDUNG HEADER ═══ */}
          <div
            className="relative mx-4 mt-1 rounded-2xl overflow-hidden bg-[#4a2810]"
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
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Header content */}
            <div className="relative z-10 p-5 pt-4">
              {/* Top row: Date + Status Badge (pojok kanan) */}
              <div className="flex items-center gap-2 mb-4 pr-9">
                <span className="text-[12px] text-[#c4a888] font-medium">
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
                Cek Bansos — {result.program}
              </h3>
              <p className="text-[13px] text-[#c4a888]">{programFullName}</p>
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
        <div className="px-4 pb-5 pt-4 flex justify-center text-center gap-2 border-t border-gray-100 dark:border-zinc-800 bg-transparent">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl text-[14px] font-bold text-center bg-[#4a2810] text-white hover:bg-[#5a3318] transition-colors block"
          >
            Tutup
          </button>
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-4">
        <InfoRow label="Nama Penerima" value={result.nama} bold />
        <InfoRow label="NIK" value={result.nik} mono />
        <InfoRow label="Program" value={result.program} />
        <InfoRow label="DTKS Tahun" value={result.dtks || '-'} />
      </div>

      {/* Brown detail card */}
      <div className="bg-[#4a2810] rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#c4a888]" />
          Detail Penerima
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <DetailItem label="Nama Lengkap" value={result.nama} />
          <DetailItem label="NIK" value={result.nik} />
          <DetailItem label="Program" value={result.program} />
          <DetailItem label="DTKS" value={result.dtks || '-'} />
          <DetailItem label="Tanggal Cek" value={today} />
          <DetailItem label="Status" value="Penerima Aktif" highlight />
        </div>
      </div>

      {/* Green keterangan */}
      {result.keterangan && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
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
      <div className="bg-[#4a2810] rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#c4a888]" />
          Data Pemohon
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <DetailItem label="Nama Lengkap" value={result.nama} />
          <DetailItem label="NIK" value={result.nik} />
          <DetailItem label="Program" value={result.program} />
          <DetailItem label="Status" value="Tidak Layak" />
        </div>
      </div>

      {/* Keterangan bullets */}
      <div className="bg-[#4a2810] rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#c4a888]" />
          Keterangan
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
            <p className="text-[12px] text-[#e0c9a8] leading-relaxed">
              {result.keterangan}
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
            <p className="text-[12px] text-[#e0c9a8] leading-relaxed">
              Jika kondisi berubah, silakan ajukan kembali melalui kelurahan
              setempat.
            </p>
          </div>
        </div>
      </div>

      {/* Red warning */}
      <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-red-700 dark:text-red-400 leading-relaxed">
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-4">
        <InfoRow label="Nama" value={result.nama} bold />
        <InfoRow label="Program" value={result.program} />
        <InfoRow label="Status" value="Dalam Verifikasi" />
      </div>

      {/* Brown timeline card */}
      <div className="bg-[#4a2810] rounded-2xl p-4 shadow-md">
        <h4 className="text-[13px] font-bold text-white mb-4 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#c4a888]" />
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
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
        <div className="flex items-start gap-1.5">
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-amber-700 dark:text-amber-400 leading-relaxed">
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
    <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <span className="text-[13px] text-gray-500 dark:text-zinc-500">
        {label}
      </span>
      <span
        className={`text-[13px] text-right ${bold ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-zinc-300'} ${mono ? 'font-mono tracking-wide' : ''}`}
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
      <span className="text-[10px] text-[#c4a888] uppercase tracking-wider font-medium">
        {label}
      </span>
      <span
        className={`text-[13px] font-semibold ${highlight ? 'text-emerald-400' : 'text-white'}`}
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
      ? 'bg-emerald-400'
      : status === 'current'
        ? 'bg-amber-400 animate-pulse'
        : 'bg-zinc-600';
  const lineColor = status === 'done' ? 'bg-emerald-400' : 'bg-zinc-700';
  const textColor = status === 'pending' ? 'text-zinc-500' : 'text-white';

  return (
    <div className="flex items-start gap-1.5">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dotColor} shrink-0`} />
        {step < 3 && <div className={`w-0.5 h-8 ${lineColor} mt-1`} />}
      </div>
      <div className="flex-1 -mt-0.5">
        <p className={`text-[13px] font-semibold ${textColor}`}>{label}</p>
        <p className="text-[11px] text-[#c4a888] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
