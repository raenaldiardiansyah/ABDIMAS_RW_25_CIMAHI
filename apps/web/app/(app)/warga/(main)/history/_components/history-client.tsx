'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { History, Inbox, ShieldCheck, Vote, MessageSquareText, FileText } from 'lucide-react';

import type { AspirasiResult, BansosResult, HistoryItem, PemiluResult, PermohonanResult } from '@/types/warga';

import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { platformFetch } from '@/lib/api/platform';
import { useAutoRefresh } from '@/lib/use-auto-refresh';
import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';

import TabBar from '@/components/warga/TabBar';
import HistoryCard from '@/components/warga/HistoryCard';

const STORAGE_KEY = 'abdimas:warga_history_v1';

const TABS = ['Semua', 'Bansos', 'Pemilu', 'Laporan', 'Permohonan'] as const;
type TabLabel = (typeof TABS)[number];

function safeParseHistory(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(isHistoryItem);
  } catch {
    return [];
  }
}

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as {
    id?: unknown;
    tipe?: unknown;
    tanggal?: unknown;
    status?: unknown;
    statusColor?: unknown;
    judul?: unknown;
    deskripsi?: unknown;
    detail?: unknown;
  };
  if (typeof v.id !== 'string') return false;
  if (v.tipe !== 'bansos' && v.tipe !== 'pemilu' && v.tipe !== 'aspirasi' && v.tipe !== 'permohonan') return false;
  if (typeof v.tanggal !== 'string') return false;
  if (typeof v.status !== 'string') return false;
  if (v.statusColor !== 'green' && v.statusColor !== 'amber' && v.statusColor !== 'red') return false;
  if (typeof v.judul !== 'string') return false;
  if (typeof v.deskripsi !== 'string') return false;
  if (typeof v.detail !== 'object' || v.detail === null) return false;
  return true;
}

function tabToTipe(tab: TabLabel): HistoryItem['tipe'] | 'all' {
  switch (tab) {
    case 'Bansos':
      return 'bansos';
    case 'Pemilu':
      return 'pemilu';
    case 'Laporan':
      return 'aspirasi';
    case 'Permohonan':
      return 'permohonan';
    default:
      return 'all';
  }
}

function tipeIcon(tipe: HistoryItem['tipe']) {
  if (tipe === 'bansos') return ShieldCheck;
  if (tipe === 'pemilu') return Vote;
  if (tipe === 'permohonan') return FileText;
  return MessageSquareText;
}

function DetailContent({ item }: { item: HistoryItem }) {
  const rows: Array<{ label: string; value: string }> = [];
  let notes = '-';
  if (item.tipe === 'bansos') {
    const detail = item.detail as BansosResult;
    rows.push(
      { label: 'Nama', value: detail.nama || '-' },
      { label: 'NIK', value: detail.nik || '-' },
      { label: 'Program', value: detail.program || '-' },
      { label: 'Status', value: detail.status || '-' },
    );
    notes = detail.keterangan || '-';
  } else if (item.tipe === 'pemilu') {
    const detail = item.detail as PemiluResult;
    rows.push(
      { label: 'Nama', value: detail.nama || '-' },
      { label: 'NIK', value: detail.nik || '-' },
      { label: 'DPT Tahun', value: detail.dptTahun || '-' },
      { label: 'TPS', value: detail.tps || '-' },
      { label: 'Status', value: detail.status || '-' },
    );
    notes = detail.keterangan || '-';
  } else if (item.tipe === 'permohonan') {
    const detail = item.detail as PermohonanResult;
    rows.push(
      { label: 'Jenis', value: detail.jenis === 'HOUSEHOLD_CREATE' ? 'Pembuatan KK' : detail.jenis === 'MUTATION_IN' ? 'Mutasi Masuk' : detail.jenis === 'MUTATION_OUT' ? 'Mutasi Keluar' : 'Lainnya' },
      { label: 'Tanggal', value: detail.tanggal || item.tanggal },
      { label: 'Status', value: detail.status === 'APPROVED' ? 'Disetujui' : detail.status === 'REJECTED' ? 'Ditolak' : 'Menunggu' },
    );
    notes = detail.ringkasan || '-';
  } else {
    const detail = item.detail as AspirasiResult;
    rows.push(
      { label: 'Jenis', value: detail.jenis || '-' },
      { label: 'Pelapor', value: detail.pelapor || '-' },
      { label: 'Tanggal', value: detail.tanggal || item.tanggal },
      { label: 'Status', value: detail.status || '-' },
    );
    notes = detail.uraian || '-';
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-input bg-background px-3 py-2.5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {row.label}
            </p>
            <p className="mt-1 break-words text-sm font-semibold leading-snug text-foreground">
              {row.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-input bg-background px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {item.tipe === 'permohonan' ? 'Ringkasan' : 'Keterangan'}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {notes}
        </p>
      </div>

      {item.tipe === 'aspirasi' ? (
        <div className="rounded-2xl border border-input bg-background px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Tanggapan Admin
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {(item.detail as AspirasiResult).tanggapanAdmin || 'Belum ada tanggapan admin.'}
          </p>
          {(item.detail as AspirasiResult).ditanggapiOleh ? (
            <p className="mt-2 text-xs font-medium text-foreground">
              {(item.detail as AspirasiResult).ditanggapiOleh}
              {(item.detail as AspirasiResult).tanggalTanggapan
                ? ` • ${new Date((item.detail as AspirasiResult).tanggalTanggapan as string).toLocaleDateString('id-ID')}`
                : ''}
            </p>
          ) : null}
        </div>
      ) : null}
      
      {item.tipe === 'permohonan' && item.detail && (item.detail as PermohonanResult).status === 'REJECTED' && (item.detail as PermohonanResult).alasanPenolakan ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">Alasan Penolakan</p>
          <p className="mt-1 text-sm leading-relaxed text-red-700">{(item.detail as PermohonanResult).alasanPenolakan}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function HistoryClient({
  fallbackItems = [],
}: {
  fallbackItems?: HistoryItem[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<HistoryItem[]>(() => {
    try {
      const stored = safeParseHistory(localStorage.getItem(STORAGE_KEY));
      return stored.length > 0 ? stored : fallbackItems;
    } catch {
      return fallbackItems;
    }
  });

  useEffect(() => {
    let mounted = true;

    const mapHistoryItem = (item: {
      id: string;
      type: 'BANSOS_CHECK' | 'PEMILU_CHECK' | 'ASPIRATION' | 'REQUEST' | 'MUTATION';
      title: string;
      description: string;
      metadata: Record<string, unknown>;
      createdAt: string;
    }): HistoryItem => {
      const createdDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      if (item.type === 'BANSOS_CHECK') {
        const eligible = Boolean(item.metadata.eligible);
        return {
          id: item.id,
          tipe: 'bansos',
          tanggal: createdDate,
          status: eligible ? 'Aktif' : 'Tidak Layak',
          statusColor: eligible ? 'green' : 'red',
          judul: item.title,
          deskripsi: item.description,
          detail: {
            status: eligible ? 'aktif' : 'tidak_layak',
            nama: String(item.metadata.nama || '-'),
            nik: String(item.metadata.nik || '-'),
            program: 'PKH',
            dtks: new Date(item.createdAt).getFullYear().toString(),
            keterangan: item.description,
          },
        };
      }

      if (item.type === 'PEMILU_CHECK') {
        const registered = Boolean(item.metadata.registered);
        return {
          id: item.id,
          tipe: 'pemilu',
          tanggal: createdDate,
          status: registered ? 'Terdaftar' : 'Tidak Terdaftar',
          statusColor: registered ? 'green' : 'red',
          judul: item.title,
          deskripsi: item.description,
          detail: {
            status: registered ? 'terdaftar' : 'tidak_terdaftar',
            nama: String(item.metadata.nama || '-'),
            nik: String(item.metadata.nik || '-'),
            dptTahun: new Date(item.createdAt).getFullYear().toString(),
            tps: item.metadata.tps ? String(item.metadata.tps) : undefined,
            keterangan: item.description,
          },
        };
      }
      
      if (item.type === 'REQUEST' || item.type === 'MUTATION') {
        const reqType = item.type === 'MUTATION' ? (item.metadata.type === 'MUTATION_IN' ? 'MUTATION_IN' : 'MUTATION_OUT') : 'HOUSEHOLD_CREATE';
        const reqStatus = String(item.metadata.status || 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED';
        return {
          id: item.id,
          tipe: 'permohonan',
          tanggal: createdDate,
          status: reqStatus === 'APPROVED' ? 'Disetujui' : reqStatus === 'REJECTED' ? 'Ditolak' : 'Menunggu',
          statusColor: reqStatus === 'APPROVED' ? 'green' : reqStatus === 'REJECTED' ? 'red' : 'amber',
          judul: item.title,
          deskripsi: item.description,
          detail: {
            jenis: reqType as any,
            tanggal: createdDate,
            status: reqStatus,
            ringkasan: item.description,
            requestId: item.id,
            alasanPenolakan: typeof item.metadata.rejectionReason === 'string' ? item.metadata.rejectionReason : null,
          }
        };
      }

      const status = String(item.metadata.status || 'SUBMITTED') as 'SUBMITTED' | 'REVIEWED' | 'RESOLVED';
      const adminReply = typeof item.metadata.adminReply === 'string' ? item.metadata.adminReply : null;
      const repliedByName = typeof item.metadata.repliedByName === 'string' ? item.metadata.repliedByName : null;
      const repliedAt = typeof item.metadata.repliedAt === 'string' ? item.metadata.repliedAt : null;

      return {
        id: item.id,
        tipe: 'aspirasi',
        tanggal: createdDate,
        status:
          status === 'RESOLVED'
            ? 'Selesai'
            : status === 'REVIEWED'
              ? 'Ditanggapi'
              : 'Terkirim',
        statusColor:
          status === 'RESOLVED'
            ? 'green'
            : status === 'REVIEWED'
              ? 'amber'
              : 'amber',
        judul: item.title,
        deskripsi: item.description,
        detail: {
          jenis: item.metadata.category === 'keluhan' ? 'keluhan' : 'masukan',
          pelapor: String(item.metadata.pelapor || '-'),
          tanggal: createdDate,
          uraian: item.description,
          status,
          tanggapanAdmin: adminReply,
          ditanggapiOleh: repliedByName,
          tanggalTanggapan: repliedAt,
        },
      };
    };

    platformFetch<
      Array<{
        id: string;
        type: 'BANSOS_CHECK' | 'PEMILU_CHECK' | 'ASPIRATION' | 'REQUEST' | 'MUTATION';
        title: string;
        description: string;
        metadata: Record<string, unknown>;
        createdAt: string;
      }>
    >('/history?page=1&limit=20')
      .then(({ data }) => {
        if (!mounted) return;
        const mapped = data.map(mapHistoryItem);
        setItems(mapped);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      })
      .catch(() => {
        if (!mounted) return;
      });

    return () => {
      mounted = false;
    };
  }, []);

  useAutoRefresh(async () => {
    const response = await platformFetch<
      Array<{
        id: string;
        type: 'BANSOS_CHECK' | 'PEMILU_CHECK' | 'ASPIRATION' | 'REQUEST' | 'MUTATION';
        title: string;
        description: string;
        metadata: Record<string, unknown>;
        createdAt: string;
      }>
    >('/history?page=1&limit=20');

    const mapped = response.data.map((item) => {
      const createdDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      if (item.type === 'BANSOS_CHECK') {
        const eligible = Boolean(item.metadata.eligible);
        return {
          id: item.id,
          tipe: 'bansos' as const,
          tanggal: createdDate,
          status: eligible ? 'Aktif' : 'Tidak Layak',
          statusColor: eligible ? 'green' as const : 'red' as const,
          judul: item.title,
          deskripsi: item.description,
          detail: {
            status: eligible ? 'aktif' : 'tidak_layak',
            nama: String(item.metadata.nama || '-'),
            nik: String(item.metadata.nik || '-'),
            program: 'PKH' as const,
            dtks: new Date(item.createdAt).getFullYear().toString(),
            keterangan: item.description,
          },
        };
      }

      if (item.type === 'PEMILU_CHECK') {
        const registered = Boolean(item.metadata.registered);
        return {
          id: item.id,
          tipe: 'pemilu' as const,
          tanggal: createdDate,
          status: registered ? 'Terdaftar' : 'Tidak Terdaftar',
          statusColor: registered ? 'green' as const : 'red' as const,
          judul: item.title,
          deskripsi: item.description,
          detail: {
            status: registered ? 'terdaftar' : 'tidak_terdaftar',
            nama: String(item.metadata.nama || '-'),
            nik: String(item.metadata.nik || '-'),
            dptTahun: new Date(item.createdAt).getFullYear().toString(),
            tps: item.metadata.tps ? String(item.metadata.tps) : undefined,
            keterangan: item.description,
          },
        };
      }
      
      if (item.type === 'REQUEST' || item.type === 'MUTATION') {
        const reqType = item.type === 'MUTATION' ? (item.metadata.type === 'MUTATION_IN' ? 'MUTATION_IN' : 'MUTATION_OUT') : 'HOUSEHOLD_CREATE';
        const reqStatus = String(item.metadata.status || 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED';
        return {
          id: item.id,
          tipe: 'permohonan' as const,
          tanggal: createdDate,
          status: reqStatus === 'APPROVED' ? 'Disetujui' : reqStatus === 'REJECTED' ? 'Ditolak' : 'Menunggu',
          statusColor: reqStatus === 'APPROVED' ? 'green' : reqStatus === 'REJECTED' ? 'red' : 'amber',
          judul: item.title,
          deskripsi: item.description,
          detail: {
            jenis: reqType as any,
            tanggal: createdDate,
            status: reqStatus,
            ringkasan: item.description,
            requestId: item.id,
            alasanPenolakan: typeof item.metadata.rejectionReason === 'string' ? item.metadata.rejectionReason : null,
          }
        };
      }

      const status = String(item.metadata.status || 'SUBMITTED') as 'SUBMITTED' | 'REVIEWED' | 'RESOLVED';
      const adminReply = typeof item.metadata.adminReply === 'string' ? item.metadata.adminReply : null;
      const repliedByName = typeof item.metadata.repliedByName === 'string' ? item.metadata.repliedByName : null;
      const repliedAt = typeof item.metadata.repliedAt === 'string' ? item.metadata.repliedAt : null;

      return {
        id: item.id,
        tipe: 'aspirasi' as const,
        tanggal: createdDate,
        status:
          status === 'RESOLVED'
            ? 'Selesai'
            : status === 'REVIEWED'
              ? 'Ditanggapi'
              : 'Terkirim',
        statusColor:
          status === 'RESOLVED'
            ? 'green' as const
            : status === 'REVIEWED'
              ? 'amber' as const
              : 'amber' as const,
        judul: item.title,
        deskripsi: item.description,
        detail: {
          jenis: item.metadata.category === 'keluhan' ? 'keluhan' : 'masukan',
          pelapor: String(item.metadata.pelapor || '-'),
          tanggal: createdDate,
          uraian: item.description,
          status,
          tanggapanAdmin: adminReply,
          ditanggapiOleh: repliedByName,
          tanggalTanggapan: repliedAt,
        },
      };
    });

    setItems(mapped);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
  }, {
    intervalMs: 10000,
  });

  const filteredItems = useMemo(() => {
    const selectedTipe = tabToTipe(TABS[activeTab]);
    if (selectedTipe === 'all') return items;
    return items.filter((item) => item.tipe === selectedTipe);
  }, [items, activeTab]);

  return (
    <WargaPage>
      <PageHeader
        title="Riwayat"
        eyebrow="Aktivitas"
        description="Pantau status pengecekan bansos, pemilu, permohonan, dan tindak lanjut laporan."
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
              <History className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <WargaPageBody className="flex flex-col gap-5">
        <TabBar
          tabs={TABS.map((label) => ({ label }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="sticky top-0 z-10 mx-auto w-fit max-w-full rounded-2xl bg-white/80 px-2 py-2 shadow-sm backdrop-blur-md"
        />

        <div className="flex flex-col gap-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-input p-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Belum Ada Riwayat
              </p>
              <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                Anda belum melakukan pengecekan atau mengirim laporan untuk
                kategori ini.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <HistoryCard
                key={item.id}
                icon={tipeIcon(item.tipe)}
                title={item.judul}
                description={item.deskripsi}
                date={item.tanggal}
                status={item.status}
                statusColor={item.statusColor}
                isExpanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <DetailContent item={item} />
              </HistoryCard>
            ))
          )}
        </div>
      </WargaPageBody>
    </WargaPage>
  );
}
