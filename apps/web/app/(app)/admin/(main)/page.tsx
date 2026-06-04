'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  FileCheck,
  FileInput,
  FileText,
  RefreshCw,
  ShieldCheck,
  Settings,
  UserPlus,
  Users,
  UserCog,
  Trash2,
} from 'lucide-react';

import AdminCalendar from '@/components/admin/AdminCalendar';
import { Button } from '@/components/ui/button';
import { getPlatformErrorMessage, platformFetch } from '@/lib/api/platform';

/* ── Types ── */

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  action?: string;
  entityType?: string;
};

type DashboardResponse = {
  stats: {
    totalWarga: number;
    totalKK: number;
    totalMutasi: number;
    pendingRequests: number;
    deltaWarga?: number;
    deltaKK?: number;
    deltaMutasi?: number;
  };
  latestActivities: ActivityItem[];
  notificationBadges: {
    pendingVerifications: number;
    pendingRequests: number;
    pendingMutations: number;
  };
};

/* ── Activity Category Mapping ── */

function getCategoryMeta(item: ActivityItem): {
  icon: LucideIcon;
  label: string;
  href: string;
} {
  if (item.entityType === 'MUTATION') return { label: 'Mutasi Penduduk', icon: RefreshCw, href: '/admin/mutasi' };
  if (item.entityType === 'HOUSEHOLD') return { label: 'Pembaruan Data KK', icon: FileText, href: '/admin/kartu-keluarga' };
  if (item.entityType === 'CITIZEN') return { label: 'Data Warga', icon: Users, href: '/admin/data-penduduk' };
  if (item.entityType === 'REQUEST') return { label: 'Permohonan Masuk', icon: FileCheck, href: '/admin/permohonan' };
  if (item.entityType === 'ADMIN_USER') return { label: 'Aktivitas Admin', icon: UserCog, href: '/admin/kelola-admin' };
  if (item.entityType === 'ACTIVITY') return { label: 'Kegiatan RW', icon: Calendar, href: '/admin/kegiatan' };
  if (item.entityType === 'VERIFICATION') return { label: 'Verifikasi Warga', icon: ShieldCheck, href: '/admin/verification' };

  return { label: 'Lainnya', icon: ClipboardList, href: '/admin' };
}

/* ── Relative time helper ── */

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs) || diffMs < 0) return 'Baru Saja';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Baru Saja';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} Menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} Jam lalu`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Kemarin';
  if (days < 7) return `${days} Hari lalu`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} Minggu lalu`;

  return new Date(isoString).toLocaleDateString('id-ID');
}

/* ── Alternating row colors ── */

const ROW_COLORS = [
  'bg-white',
  'bg-[#F4F8FF]',
];

/* ── Quick Actions ── */

const quickActions = [
  {
    icon: UserPlus,
    label: 'Tambah Warga',
    sub: 'Data Penduduk',
    href: '/admin/data-penduduk',
  },
  {
    icon: Users,
    label: 'Tambah KK',
    sub: 'Kartu Keluarga',
    href: '/admin/kartu-keluarga',
  },
  {
    icon: FileBarChart,
    label: 'Laporan Mutasi',
    sub: 'Mutasi Penduduk',
    href: '/admin/laporan',
  },
];

/* ── Component ── */

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [hiddenActivities, setHiddenActivities] = useState<string[]>([]);
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dismissed_activities');
      if (stored) setHiddenActivities(JSON.parse(stored));
    } catch { }
  }, []);

  const dismissActivity = (id: string) => {
    setHiddenActivities((prev) => {
      const next = [...prev, id];
      localStorage.setItem('dismissed_activities', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await platformFetch<DashboardResponse>('/admin/dashboard');
        if (!active) return;
        setDashboard(response.data);
        setDashboardError(null);
      } catch (error) {
        if (!active) return;
        setDashboard(null);
        setDashboardError(getPlatformErrorMessage(error, 'Gagal memuat dashboard admin.'));
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

  const activities = dashboard?.latestActivities ?? [];

  const groupedActivities = useMemo(() => {
    const groups: Record<string, { label: string; icon: LucideIcon; href: string; items: ActivityItem[] }> = {};

    activities.forEach((item) => {
      if (hiddenActivities.includes(item.id)) return;
      const meta = getCategoryMeta(item);
      if (!groups[meta.label]) {
        groups[meta.label] = { label: meta.label, icon: meta.icon, href: meta.href, items: [] };
      }
      groups[meta.label].items.push(item);
    });

    const defaultCategories = [
      { label: 'Mutasi Penduduk', icon: RefreshCw, href: '/admin/mutasi' },
      { label: 'Pembaruan Data KK', icon: FileText, href: '/admin/kartu-keluarga' },
      { label: 'Data Warga', icon: Users, href: '/admin/data-penduduk' },
      { label: 'Permohonan Masuk', icon: FileCheck, href: '/admin/permohonan' },
    ];

    defaultCategories.forEach((cat) => {
      if (!groups[cat.label]) {
        groups[cat.label] = { ...cat, items: [] };
      }
    });

    Object.values(groups).forEach((g) => {
      g.items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()); // sort newest first
    });

    return Object.values(groups);
  }, [activities, hiddenActivities]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      {/* ── Left Column ── */}
      <div className="flex flex-col gap-5">
        {dashboardError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-bold">Dashboard gagal dimuat</p>
            <p className="mt-1 text-xs leading-relaxed">{dashboardError}</p>
          </div>
        ) : null}

        {/* Request Queue Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-5 py-5 text-white shadow-lg sm:px-6 sm:py-5">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.08]" />
          <div className="pointer-events-none absolute right-16 top-6 h-24 w-24 rounded-full bg-white/[0.12]" />
          <div className="pointer-events-none absolute -bottom-5 right-40 h-16 w-16 rounded-full bg-white/[0.08]" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white">
                Request Page
              </span>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  <span className="font-extrabold">Periksa</span> semua <span className="font-extrabold">permohonan</span> yang masuk.
                </h2>
              </div>
            </div>
            <Button
              asChild
              className="h-11 shrink-0 rounded-xl border border-white bg-white text-[#2563EB] shadow-sm hover:bg-white/90"
            >
              <Link href="/admin/permohonan" className="inline-flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Cek Permohonan
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards — Colored with glassmorphic delta badges */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: 'Total warga',
              value: stats.totalWarga,
              sub: 'Jiwa',
              icon: Users,
              delta: stats.deltaWarga,
              deltaSuffix: 'Jiwa',
              bg: 'bg-gradient-to-br from-[#2563EB] to-[#3B82F6]',
            },
            {
              label: 'Total KK',
              value: stats.totalKK,
              sub: 'Kartu Keluarga',
              icon: FileText,
              delta: stats.deltaKK,
              deltaSuffix: 'Keluarga',
              bg: 'bg-gradient-to-br from-[#4F86F0] to-[#6AA1F7]',
            },
            {
              label: 'Total Mutasi',
              value: stats.totalMutasi,
              sub: 'Laporan',
              icon: RefreshCw,
              delta: stats.deltaMutasi,
              deltaSuffix: 'Laporan',
              bg: 'bg-gradient-to-br from-[#7CA8F8] to-[#93BCF9]',
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`group relative overflow-hidden rounded-2xl ${item.bg} p-4 shadow-md transition-shadow hover:shadow-lg`}
            >
              {/* Subtle decorative circle */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/[0.06]" />
              <div className="relative z-10">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-xs font-medium text-white/80">{item.label}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {item.value}
                  </span>
                  <span className="pb-0.5 text-xs font-normal text-white/70">{item.sub}</span>
                  {/* Glassmorphic delta badge */}
                  {item.delta != null && item.delta > 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      +{item.delta} {item.deltaSuffix}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aktivitas Terbaru — Category Accordion */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-[#1F2937]">Aktivitas Terbaru</h3>
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            {groupedActivities.map((group, i) => {
              const isExpanded = expandedCategory === group.label;
              const hasItems = group.items.length > 0;
              const rowBg = ROW_COLORS[i % 2];

              const currentPage = categoryPages[group.label] || 1;
              const totalPages = Math.max(1, Math.ceil(group.items.length / 5));
              const currentPg = Math.min(currentPage, totalPages);
              const paginatedItems = group.items.slice((currentPg - 1) * 5, currentPg * 5);

              return (
                <div key={group.label} className={`flex flex-col ${rowBg}`}>
                  {/* Category Header (Accordion Trigger) */}
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isExpanded ? null : group.label)}
                    className={`flex w-full items-center justify-between px-4 py-3 transition-colors ${isExpanded ? 'bg-[#EEF2FF]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-colors ${
                        isExpanded ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-white border-[#DBEAFE] text-[#2563EB]'
                      }`}>
                        <group.icon className="h-4 w-4" />
                        {/* Red Dot if there are activities */}
                        {hasItems && (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
                        )}
                      </div>
                      <p className={`text-sm font-bold transition-colors ${isExpanded ? 'text-[#1D4ED8]' : 'text-[#2563EB]'}`}>{group.label}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[#9CA3AF]">
                        {hasItems ? `${group.items.length} aktivitas` : 'Tidak ada'}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180 text-[#1D4ED8]' : 'text-[#2563EB]'}`}
                      />
                    </div>
                  </button>

                  {/* Expanded Items */}
                  {isExpanded && (
                    <div className="bg-[#F8FAFC] px-4 py-3 shadow-inner">
                      {hasItems ? (
                        <div className="flex flex-col gap-2">
                          {paginatedItems.map((item, j) => (
                            <div
                              key={item.id}
                              className="group/link flex items-center justify-between py-3 border-b border-[#E5E7EB] last:border-b-0"
                            >
                              <div className="min-w-0 flex-1 pr-4">
                                <Link
                                  href={group.href}
                                  onClick={() => dismissActivity(item.id)}
                                  className="text-xs font-semibold text-[#1F2937] line-clamp-1"
                                >
                                  {item.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="truncate text-[11px] font-medium text-[#6B7280]">{item.subtitle}</p>
                                  <span className="shrink-0 text-[10px] text-[#9CA3AF]">• {relativeTime(item.time)}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => dismissActivity(item.id)}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0 rounded-full"
                                title="Tandai Selesai"
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {/* Pagination inside group */}
                          {totalPages > 1 && (
                            <div className="mt-2 flex items-center justify-between border-t border-[#E5E7EB] pt-2">
                              <span className="text-[11px] font-medium text-[#6B7280]">
                                Hal {currentPg} / {totalPages}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCategoryPages(p => ({ ...p, [group.label]: Math.max(1, currentPg - 1) }))}
                                  disabled={currentPg === 1}
                                  className="h-6 px-2 text-[10px]"
                                >
                                  Prev
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCategoryPages(p => ({ ...p, [group.label]: Math.min(totalPages, currentPg + 1) }))}
                                  disabled={currentPg === totalPages}
                                  className="h-6 px-2 text-[10px]"
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-2 text-center">
                          <p className="text-xs text-[#9CA3AF]">Belum ada aktivitas.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Aksi Cepat — 3 horizontal buttons */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-[#1F2937]">Aksi Cepat</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                href={action.href}
                key={action.label}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F86F0] to-[#6AA1F7] px-4 py-3.5 text-white shadow-md transition-all hover:shadow-lg hover:brightness-105 active:scale-[0.98]"
              >
                {/* Decorative circle */}
                <div className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 rounded-full bg-white/[0.08]" />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors duration-300 group-hover:bg-white">
                  <action.icon className="h-5 w-5 text-white transition-colors duration-300 group-hover:text-[#3B82F6]" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-bold leading-tight">{action.label}</p>
                  <p className="text-[11px] font-medium text-white/75">{action.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Column — Calendar (stretches full height) ── */}
      <div className="xl:self-stretch">
        <AdminCalendar />
      </div>
    </div>
  );
}
