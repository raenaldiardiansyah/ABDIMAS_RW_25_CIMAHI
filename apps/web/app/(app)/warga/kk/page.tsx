'use client';

import Link from 'next/link';
import { ChevronLeft, FilePlus2, UserPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PilihanTambahKKPage() {
  return (
    <div className="flex w-full flex-col gap-6 pb-24">
      {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Header ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
      <div className="flex items-center justify-between">
        <Link
          href="/warga"
          className="flex items-center gap-1 md:gap-2 text-sm md:text-base font-semibold text-violet-600 transition hover:opacity-80 bg-transparent border-none outline-none"
        >
          <ChevronLeft className="h-5 w-5" />
          Kembali
        </Link>
      </div>

      {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Title Card ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
      <div className="relative overflow-hidden rounded-[12px] bg-[#F5F3FF] p-4 md:p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#8B5CF6]/[0.05]" />
        <div className="pointer-events-none absolute right-12 top-2 h-24 w-24 rounded-full bg-[#8B5CF6]/[0.08]" />

        <div className="relative z-10 flex items-start md:items-center gap-3">
          <div className="flex size-10 md:size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
            <FileText className="size-5 md:size-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#8B5CF6]">Layanan Kartu Keluarga</h1>
            <p className="mt-1 text-xs md:text-sm text-[#8B5CF6]/80">
              Pilih layanan pengajuan KK yang ingin Anda lakukan.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Link href="/warga/kk/tambah" className="group rounded-[16px] bg-white p-4 md:p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-violet-100 flex flex-col gap-3 md:gap-4">
          <div className="flex size-12 md:size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition-transform group-hover:scale-110">
            <FilePlus2 className="size-6 md:size-7" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors">Tambah KK Baru</h2>
            <p className="mt-1 text-xs md:text-sm text-gray-500">Pengajuan pembuatan Kartu Keluarga (KK) baru untuk keluarga Anda.</p>
          </div>
        </Link>
        <Link href="/warga/kk/tambah-anggota" className="group rounded-[16px] bg-white p-4 md:p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-emerald-100 flex flex-col gap-3 md:gap-4">
          <div className="flex size-12 md:size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
            <UserPlus className="size-6 md:size-7" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Tambah Anggota Keluarga</h2>
            <p className="mt-1 text-xs md:text-sm text-gray-500">Pendaftaran anggota keluarga baru (anak, istri, dll) ke dalam KK yang sudah ada.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
