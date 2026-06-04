import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OnboardingHero() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-10 text-slate-950">
      <section className="w-full max-w-md">
        <div className="rounded-[32px] border border-slate-200 bg-white px-7 pb-7 pt-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] border border-slate-200 bg-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <Landmark className="h-9 w-9 text-[color:var(--primary)]" aria-hidden="true" />
          </div>

          <h1 className="max-w-xs text-[2.55rem] font-bold leading-[1.02] tracking-[-0.055em] text-slate-950">
            Layanan Digital
            <br />
            RW 25 Cimahi
          </h1>
          <p className="mt-5 max-w-sm text-[17px] leading-8 text-slate-500">
            Akses layanan warga, pengajuan, dan informasi kegiatan. Masuk jika sudah punya akun, atau daftar untuk
            verifikasi identitas.
          </p>

          <div className="relative mt-9 h-56 overflow-hidden rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,#dbeafe)]" />
            <div className="absolute left-[-8%] bottom-0 h-24 w-[36%] rounded-t-[3rem] bg-[#d8e5ff]" />
            <div className="absolute left-[18%] bottom-0 h-36 w-[28%] rounded-t-[2.2rem] bg-[#dfe9ff]" />
            <div className="absolute left-[52%] bottom-0 h-20 w-[16%] rounded-t-[2rem] bg-[#dce8ff]" />
            <div className="absolute right-[10%] bottom-0 h-40 w-[18%] rounded-t-[2.5rem] bg-[#e3ecff]" />
            <div className="absolute left-[58%] bottom-10 h-20 w-20 rounded-t-[1.4rem] rounded-b-[0.8rem] border-[7px] border-[#3b82f6] border-b-0 bg-white" />
            <div className="absolute left-[63.5%] bottom-21 h-10 w-10 rotate-45 border-l-[7px] border-t-[7px] border-[#3b82f6] bg-white" />
            <div className="absolute left-[67%] bottom-15 h-12 w-1 rounded-full bg-[#2563eb]" />
            <div className="absolute left-[67.5%] bottom-27 h-8 w-6 rounded-r-full rounded-tl-full bg-[#2563eb]" />
            <div className="absolute left-[8%] bottom-10 h-16 w-16 rounded-full bg-[#c7dbff]" />
            <div className="absolute left-[12%] bottom-4 h-14 w-1 rounded-full bg-[#7ea7ff]" />
            <div className="absolute right-[14%] bottom-10 h-20 w-20 rounded-full bg-[#d8e5ff]" />
            <div className="absolute right-[18%] bottom-2 h-18 w-1 rounded-full bg-[#9bbcff]" />
          </div>

          <div className="mt-8 space-y-3">
            <Button
              asChild
              className="h-auto w-full rounded-[22px] bg-[color:var(--primary)] px-5 py-4 text-sm font-semibold tracking-[-0.01em] text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] hover:bg-[color:var(--brand-700)]"
            >
              <Link href="/sign-in">
                Masuk
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="h-auto w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold tracking-[-0.01em] text-[color:var(--primary)] shadow-none hover:bg-slate-50"
            >
              <Link href="/register">Daftar Akun Warga</Link>
            </Button>
          </div>

          <p className="mt-5 text-center text-[13px] leading-6 text-slate-400">
            Warga terdaftar dapat langsung masuk. Akun baru tetap melalui verifikasi identitas.
          </p>
        </div>
      </section>
    </main>
  );
}
