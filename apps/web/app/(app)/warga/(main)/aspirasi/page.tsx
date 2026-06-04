'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageSquareText, RefreshCw } from 'lucide-react';

import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';
import { useAutoRefresh } from '@/lib/use-auto-refresh';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';
import { WargaPage, WargaPageBody } from '@/app/(app)/warga/_components/warga-page';

type AspirasiStatus = 'SUBMITTED' | 'REVIEWED' | 'RESOLVED';

type AspirasiItem = {
  id: string;
  title: string;
  message: string;
  category: string | null;
  status: AspirasiStatus;
  adminReply: {
    message: string;
    repliedAt: string;
    repliedByName: string;
  } | null;
  createdAt: string;
};

const FILTERS: Array<{ key: 'ALL' | AspirasiStatus; label: string }> = [
  { key: 'ALL', label: 'Semua' },
  { key: 'SUBMITTED', label: 'Terkirim' },
  { key: 'REVIEWED', label: 'Ditanggapi' },
  { key: 'RESOLVED', label: 'Selesai' },
];

function statusLabel(status: AspirasiStatus) {
  if (status === 'RESOLVED') return 'Selesai';
  if (status === 'REVIEWED') return 'Ditanggapi';
  return 'Terkirim';
}

function statusClass(status: AspirasiStatus) {
  if (status === 'RESOLVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REVIEWED') return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700';
}

export default function WargaAspirasiPage() {
  const [items, setItems] = useState<AspirasiItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | AspirasiStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await platformFetch<AspirasiItem[]>('/aspirations?page=1&limit=50');
      setItems(response.data);
    } catch (err) {
      setError(getPlatformErrorMessage(err, 'Gagal memuat aspirasi.'));
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

  const filtered = useMemo(() => {
    if (filter === 'ALL') return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  return (
    <WargaPage>
      <PageHeader
        title="Aspirasi Warga"
        eyebrow="Portal RW 25 Cimahi"
        description="Pantau status aspirasi dan tanggapan admin."
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
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant={filter === item.key ? 'default' : 'outline'}
              className="rounded-2xl"
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
          <Button type="button" variant="outline" className="rounded-2xl" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Muat ulang
          </Button>
        </div>

        {error ? (
          <Card className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </Card>
        ) : null}

        {loading ? (
          <Card className="rounded-3xl border border-input bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Memuat aspirasi...
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="rounded-3xl border border-input bg-muted/30 p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
                <MessageSquareText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Belum ada aspirasi</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kirim aspirasi dari beranda, lalu statusnya akan tampil di sini.
                </p>
              </div>
              <Button asChild className="rounded-2xl">
                <Link href="/warga">Kembali ke beranda</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <Card key={item.id} className="rounded-3xl border border-input p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 text-primary shadow-none">
                        {item.category ?? 'Aspirasi'}
                      </Badge>
                      <Badge className={`rounded-full shadow-none ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-base font-bold text-foreground">{item.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <Button asChild variant="outline" className="rounded-2xl">
                    <Link href="/warga/history">Lihat di riwayat</Link>
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                  {item.message}
                </div>

                <div className="mt-4 rounded-2xl border border-input bg-background p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Tanggapan Admin
                  </p>
                  {item.adminReply ? (
                    <>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {item.adminReply.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.adminReply.repliedByName} •{' '}
                        {new Date(item.adminReply.repliedAt).toLocaleString('id-ID')}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Belum ada tanggapan admin.
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </WargaPageBody>
    </WargaPage>
  );
}
