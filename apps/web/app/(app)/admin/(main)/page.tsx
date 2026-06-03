'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileCheck, FileText, RefreshCw, UserPlus, Users } from 'lucide-react';

import AdminCalendar from '@/components/admin/AdminCalendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { platformFetch } from '@/lib/api/platform';

type DashboardResponse = {
  stats: {
    totalWarga: number;
    totalKK: number;
    totalMutasi: number;
    pendingRequests: number;
  };
  latestActivities: Array<{
    title: string;
    subtitle: string;
    time: string;
  }>;
  notificationBadges: {
    pendingVerifications: number;
    pendingRequests: number;
    pendingMutations: number;
  };
};

const quickActions = [
  { label: 'Tambah data warga', sub: 'Kelola data kependudukan', href: '/admin/data-penduduk' },
  { label: 'Kelola kartu keluarga', sub: 'Data KK dan anggota keluarga', href: '/admin/kartu-keluarga' },
  { label: 'Lihat laporan', sub: 'Ekspor rekap data warga', href: '/admin/laporan' },
];

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await platformFetch<DashboardResponse>('/admin/dashboard');
        if (!active) return;
        setDashboard(response.data);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setDashboard(null);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard?.stats ?? {
    totalWarga: 0,
    totalKK: 0,
    totalMutasi: 0,
    pendingRequests: 0,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="border-none bg-[#2563EB] text-white shadow-lg">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit rounded-full border border-white/15 bg-white/10 text-white shadow-none">
                Request Queue
              </Badge>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Periksa semua permohonan yang masuk
                </h2>
                <p className="max-w-xl text-sm text-white/80">
                  Prioritaskan verifikasi warga dan tindak lanjuti permohonan yang masih tertunda.
                </p>
              </div>
            </div>
            <Button asChild className="h-11 rounded-xl bg-white text-[#1F2937] hover:bg-white/90">
              <Link href="/admin/permohonan" className="inline-flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Cek Permohonan ({stats.pendingRequests})
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Total warga', value: stats.totalWarga, sub: 'Jiwa', icon: Users },
            { label: 'Total KK', value: stats.totalKK, sub: 'Kartu Keluarga', icon: FileText },
            { label: 'Total Mutasi', value: stats.totalMutasi, sub: 'Laporan', icon: RefreshCw },
          ].map((item) => (
            <Card key={item.label} className="border-[#D8DEE8] bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#2563EB]">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-slate-950">{item.value}</span>
                  <span className="pb-1 text-sm text-slate-500">{item.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-[#D8DEE8] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-950">Aktivitas terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(dashboard?.latestActivities ?? []).length > 0 ? (
                dashboard?.latestActivities.map((item, i) => (
                  <div
                    key={`${item.time}-${i}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] px-4 py-3"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2C5F75] shadow-sm">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                      {new Date(item.time).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada aktivitas admin.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#D8DEE8] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-950">Aksi cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  href={action.href}
                  key={action.label}
                  className="flex items-center gap-4 rounded-2xl border border-[#E4E7EC] bg-white px-4 py-4 transition hover:border-[#2563EB]/20 hover:bg-[#F4F8FF]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#2563EB]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.sub}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <AdminCalendar />
      </div>
    </div>
  );
}
