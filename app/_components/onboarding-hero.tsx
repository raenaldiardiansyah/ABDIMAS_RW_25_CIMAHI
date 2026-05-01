import Link from "next/link";
import { Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OnboardingHero() {
  return (
    <main className="min-h-screen bg-[color:var(--brand-600)] text-white px-6 py-10 flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-secondary border border-white/20 flex items-center justify-center">
            <Landmark className="w-7 h-7" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          Layanan Digital
          <br />
          RW 25 Cimahi
        </h1>
        <p className="text-sm text-white/70 mt-3 leading-relaxed">
          Akses layanan warga, pengajuan, dan informasi kegiatan. Masuk jika sudah punya akun, atau daftar untuk
          verifikasi identitas.
        </p>

        <div className="mt-10 space-y-3">
          <Button
            asChild
            className="w-full h-auto py-3.5 rounded-xl font-bold text-sm tracking-wide bg-[color:var(--panel-on-brand)] text-[color:var(--brand-600)] hover:opacity-95 shadow-lg"
          >
            <Link href="/sign-in">Masuk</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="w-full h-auto py-3.5 rounded-xl font-bold text-sm tracking-wide border border-white/20 hover:opacity-95"
          >
            <Link href="/register">Daftar Akun Warga</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
