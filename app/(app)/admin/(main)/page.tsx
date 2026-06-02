'use client';

import Link from 'next/link';
import {
  Users,
  FileText,
  RefreshCw,
  UserPlus,
  FileCheck,
} from 'lucide-react';

import AdminCalendar from '@/components/admin/AdminCalendar';
import { ACTIVITIES, QUICK_ACTIONS, DASHBOARD_STATS } from '@/lib/dummydataadmin';

/* ── Page ────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  return (
    <div className="flex gap-[1.5%] h-full">
      {/* ── Left: Main Content ── */}
      <div className="flex flex-1 flex-col gap-6 min-w-0">
        
        {/* Hero Banner */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-[clamp(1.5rem,3vh,2rem)] text-white min-h-[min(30vh,240px)]">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-20 top-10 h-32 w-32 rounded-full bg-white/5" />
          
          <div>
            <p className="text-[clamp(10px,1vh,12px)] font-medium text-white/80 uppercase tracking-wider mb-2">Request Page</p>
            <h2 className="text-[clamp(24px,3.5vh,40px)] font-normal leading-[1.1] max-w-[400px]">
              <span className="font-bold">Periksa</span> semua <span className="font-bold">permohonan</span> yang masuk.
            </h2>
          </div>

          <div className="absolute bottom-8 right-8">
            <Link
              href="/admin/permohonan"
              className="inline-flex items-center gap-2 rounded-full bg-white px-[clamp(16px,2vw,24px)] py-[clamp(8px,1.5vh,12px)] text-sm font-bold text-[#2563EB] shadow-sm transition hover:bg-white/90"
            >
              <FileCheck className="h-5 w-5" />
              Cek Permohonan
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-[1.5%] mt-[clamp(-8px,-1vh,0px)]">
          {/* Total Warga */}
          <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-[clamp(12px,2vh,20px)] text-white shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white/90">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Total warga</span>
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">
                {DASHBOARD_STATS.totalWargaDelta}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[clamp(24px,3vh,30px)] font-extrabold tracking-tight">{DASHBOARD_STATS.totalWarga}</span>
              <span className="text-sm font-medium text-white/90">Jiwa</span>
            </div>
          </div>

          {/* Total KK */}
          <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-[clamp(12px,2vh,20px)] text-white shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="flex items-center gap-2 text-white/90 mb-3">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Total KK</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[clamp(24px,3vh,30px)] font-extrabold tracking-tight">{DASHBOARD_STATS.totalKK}</span>
              <span className="text-sm font-medium text-white/90">Kartu Keluarga</span>
            </div>
          </div>

          {/* Total Mutasi */}
          <div className="rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] p-[clamp(12px,2vh,20px)] text-white shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="flex items-center gap-2 text-white/90 mb-3">
              <RefreshCw className="h-4 w-4" />
              <span className="text-xs font-medium">Total Mutasi</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[clamp(24px,3vh,30px)] font-extrabold tracking-tight">{DASHBOARD_STATS.totalMutasi}</span>
              <span className="text-sm font-medium text-white/90">Laporan</span>
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="mt-[clamp(4px,1vh,8px)]">
          <h3 className="mb-[clamp(8px,1.5vh,16px)] text-[clamp(18px,2vh,22px)] font-bold text-[#334155]">
            Aktivitas Terbaru
          </h3>
          <div className="flex flex-col gap-[clamp(6px,1vh,12px)]">
            {ACTIVITIES.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-[clamp(12px,1.5vw,16px)] rounded-[20px] bg-white px-[clamp(16px,2vw,20px)] py-[clamp(8px,1.2vh,16px)] shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-[clamp(32px,4vh,48px)] w-[clamp(32px,4vh,48px)] shrink-0 items-center justify-center rounded-full border border-[#EFF6FF] bg-[#F8FAFC]">
                  <RefreshCw className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-[#2563EB]">
                    {item.title}
                  </p>
                  <p className="truncate text-[13px] text-[#94A3B8] font-medium mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <span className="shrink-0 text-[13px] font-semibold text-[#2563EB]">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Aksi Cepat */}
        <div className="mt-[clamp(4px,1vh,16px)]">
          <h3 className="mb-[clamp(8px,1.5vh,16px)] text-[clamp(18px,2vh,22px)] font-bold text-[#334155]">
            Aksi Cepat
          </h3>
          <div className="flex flex-wrap gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                href={action.href}
                key={action.label}
                className="flex flex-1 min-w-[200px] min-h-[90px] items-center gap-5 rounded-[2rem] bg-[#3B82F6] px-[clamp(20px,2vw,32px)] py-[clamp(20px,2.5vh,32px)] text-left text-white shadow-md transition hover:bg-[#2563EB] active:scale-[0.98]"
              >
                <div className="flex h-[clamp(40px,5vh,56px)] w-[clamp(40px,5vh,56px)] shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <UserPlus className="h-6 w-6 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-[clamp(16px,1.8vw,20px)] font-bold">{action.label}</p>
                  <p className="text-[clamp(12px,1.2vw,14px)] text-white/80 font-medium mt-0.5">{action.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Admin Calendar Banner ── */}
      <div className="hidden w-[28%] min-w-[250px] shrink-0 xl:block">
        <AdminCalendar />
      </div>
    </div>
  );
}
