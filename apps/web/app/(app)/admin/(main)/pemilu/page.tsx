'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, Flag, MapPin, PlusCircle } from 'lucide-react';

import AdminAsyncState from '@/components/admin/AdminAsyncState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';

type PemiluEvent = {
  id: string;
  title: string;
  requirements: string[];
  pollingStations: Array<{ label: string; location: string; assignedRtScope: string[] }>;
  electionDate: string;
  startTime: string | null;
  endTime: string | null;
};

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return 'Jam belum diatur';
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || 'Jam belum diatur';
}

export default function AdminPemiluPage() {
  const [items, setItems] = useState<PemiluEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await platformFetch<PemiluEvent[]>('/admin/pemilu?page=1&limit=50');
        if (!active) return;
        setItems(response.data);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setItems([]);
        setError(getPlatformErrorMessage(loadError, 'Gagal memuat data pemilu.'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--admin-heading)]">Pemilu</h1>
          <p className="mt-2 text-sm text-[color:var(--admin-subtle)]">
            Kelola agenda pemilu, persyaratan, TPS, dan pembagian RT yang terhubung ke jadwal warga.
          </p>
        </div>
        <Button asChild className="rounded-2xl bg-[color:var(--admin-primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--admin-primary-strong)]">
          <Link href="/admin/pemilu/tambah">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pemilu
          </Link>
        </Button>
      </div>

      {error ? (
        <AdminAsyncState
          mode="error"
          page="Pemilu"
          action="memuat data pemilu"
          description={error}
          onRetry={() => {
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
        />
      ) : loading ? (
        <AdminAsyncState mode="loading" page="Pemilu" action="memuat data pemilu" />
      ) : items.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--admin-surface-soft)]">
            <Flag className="h-6 w-6 text-[color:var(--admin-muted)]" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[color:var(--admin-heading)]">Belum ada agenda pemilu</h3>
          <p className="mt-1 text-sm text-[color:var(--admin-subtle)]">Buat agenda pemilu pertama untuk menentukan TPS per RT.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)]">
                    <Flag className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-[color:var(--admin-heading)]">{item.title}</h2>
                      <Badge className="rounded-full border border-[color:var(--admin-primary-soft-border)] bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary-soft-foreground)] shadow-none">
                        {item.pollingStations.length} TPS
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[color:var(--admin-subtle)]">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(item.electionDate).toLocaleDateString('id-ID')}
                      </span>
                      <span>{formatTimeRange(item.startTime, item.endTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] px-4 py-3 text-sm text-[color:var(--admin-body)]">
                  <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-subtle)]">Persyaratan</p>
                  <p className="mt-1 font-semibold">{item.requirements.length} item</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {item.pollingStations.map((station) => (
                  <div key={`${item.id}-${station.label}`} className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-soft)] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[color:var(--admin-heading)]">{station.label}</p>
                        <p className="mt-1 inline-flex items-center gap-2 text-sm text-[color:var(--admin-subtle)]">
                          <MapPin className="h-4 w-4" />
                          {station.location}
                        </p>
                      </div>
                      <Badge variant="secondary" className="w-fit rounded-full shadow-none">
                        {station.assignedRtScope.map((rt) => `RT ${rt}`).join(', ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
