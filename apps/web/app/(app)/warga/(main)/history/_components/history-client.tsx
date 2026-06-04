'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { History, Inbox, ShieldCheck, Vote, MessageSquareText } from 'lucide-react';

import type { AspirasiResult, BansosResult, HistoryItem, PemiluResult } from '@/types/warga';

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

const TABS = ['Semua', 'Bansos', 'Pemilu', 'Laporan'] as const;
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
    default:
      return 'all';
  }
}

function tipeIcon(tipe: HistoryItem['tipe']) {
  if (tipe === 'bansos') return ShieldCheck;
  if (tipe === 'pemilu') return Vote;
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
          Keterangan
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
        const mapped: HistoryItem[] = data.map(mapHistoryItem);
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

    const mapped: HistoryItem[] = response.data.map((item) => {
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
        statusColor: status === 'RESOLVED' ? 'green' as const : 'amber' as const,
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

  const filtered = useMemo(() => {
    const tab = TABS[activeTab] ?? 'Semua';
    const tipe = tabToTipe(tab);
    if (tipe === 'all') return items;
    return items.filter((item) => item.tipe === tipe);
  }, [activeTab, items]);

  return (
    <WargaPage>
      <PageHeader
        title="Riwayat Aktivitas"
        eyebrow="Portal RW 25 Cimahi"
        description="Cek bansos, pemilu, dan laporan aspirasi Anda."
        variant="brand"
        className="pb-7"
        titleClassName="text-xl"
        rightSlot={
          <Button
            asChild
            variant="outline"
            size="icon"
            className="mt-1 rounded-2xl border border-white/20 bg-white/10 text-primary-foreground shadow-sm transition-colors hover:bg-white/15"
            aria-label="Kembali ke beranda"
          >
            <Link href="/warga">
              <History className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        }
        bottomSlot={
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/14 shadow-lg">
              <Inbox className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-tight text-white">
                Pantau status terbaru
              </p>
              <p className="mt-1 text-xs text-primary-foreground/75">Riwayat akun warga dari backend.</p>
            </div>
          </div>
        }
      />

      <WargaPageBody className="flex flex-col gap-4">
        <TabBar
          tabs={[...TABS]}
          activeTab={activeTab}
          onTabChange={(index) => setActiveTab(index)}
        />

        {filtered.length === 0 ? (
          <Card className="rounded-3xl border border-input bg-muted/30 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
                <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-base font-bold">Belum ada riwayat</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mulai cek bansos, pemilu, atau kirim aspirasi dari beranda.
              </p>
              <Button asChild className="mt-5 h-11 rounded-2xl px-6 font-semibold">
                <Link href="/warga">Ke Beranda</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id;
              const Icon = tipeIcon(item.tipe);
              return (
                <div key={item.id} className={cn('group')}>
                  <HistoryCard
                    tanggal={item.tanggal}
                    judul={item.judul}
                    deskripsi={item.deskripsi}
                    status={item.status}
                    statusColor={item.statusColor}
                    isExpanded={isExpanded}
                    onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                  >
                    <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="capitalize">{item.tipe}</span>
                    </div>
                    <DetailContent item={item} />
                  </HistoryCard>
                </div>
              );
            })}
          </div>
        )}
      </WargaPageBody>
    </WargaPage>
  );
}
